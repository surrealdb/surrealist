import posthog from "posthog-js";
import { adapter } from "~/adapter";
import { useCloudStore } from "~/stores/cloud";
import { useConfigStore } from "~/stores/config";
import { CloudProfile, CloudInstanceType, CloudRegion, CloudOrganization, CloudBillingCountry } from "~/types";
import { getCloudEndpoints } from "./endpoints";

export interface APIRequestInit extends RequestInit {
	management?: boolean;
}

/**
 * Execute a fetch request against the API and returns
 * the JSON response
 */
export async function fetchAPI<T = unknown>(path: string, options?: APIRequestInit | undefined): Promise<T> {
	const { sessionToken } = useCloudStore.getState();
	const { apiBase, mgmtBase } = getCloudEndpoints();

	const baseUrl = options?.management ? mgmtBase : apiBase;
	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};

	if (sessionToken) {
		headers['Authorization'] = `Bearer ${sessionToken}`;
	}

	const response = await adapter.fetch(`${baseUrl}${path}`, {
		headers: {
			...headers,
			...options?.headers
		},
		...options
	});

	if (!response.ok) {
		const error = new ApiError(response);

		posthog.capture('cloud_api_error', {
			status: response.status,
			endpoint: path,
			message: await error.errorMessage()
		});

		throw new ApiError(response);
	}

	if (response.headers.get("Content-Type")?.startsWith("application/json")) {
		return await response.json();
	}

	return {} as T;
}

/**
 * Fetch essential information from the API
 */
export async function updateCloudInformation() {
	const { setCloudValues } = useCloudStore.getState();
	const { activeCloudOrg, setActiveCloudOrg } = useConfigStore.getState();

	const [
		profile,
		instanceTypes,
		instanceVersions,
		regions,
		billingCountries
	] = await Promise.all([
		fetchAPI<CloudProfile>("/user/profile"),
		fetchAPI<CloudInstanceType[]>("/instancetypes"),
		fetchAPI<string[]>("/instanceversions"),
		fetchAPI<CloudRegion[]>("/regions"),
		fetchAPI<CloudBillingCountry[]>("/billingcountries"),
	]);

	const organization = await fetchAPI<CloudOrganization>(`/organizations/${profile.default_org}`);

	setCloudValues({
		profile,
		instanceTypes,
		instanceVersions,
		regions,
		organizations: [organization],
		billingCountries,
	});

	if (activeCloudOrg === "") {
		setActiveCloudOrg(profile.default_org);
	}
}

/**
 * Error response from the API
 */
export class ApiError extends Error {

	public response: Response;

	public constructor(response: Response) {
		super(`Request failed for "${response.url}" (${response.status}): ${response.statusText}`);
		this.response = response;
	}

	public isJson() {
		return this.response.headers.get("Content-Type")?.startsWith("application/json") ?? false;
	}

	public async errorMessage() {
		if (!this.isJson()) return "";

		const { message } = await this.response.json();

		return message;
	}

}