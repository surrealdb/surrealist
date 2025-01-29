import type {
	CloudBillingCountry,
	CloudInstanceType,
	CloudOrganization,
	CloudProfile,
	CloudRegion,
} from "~/types";

import { adapter } from "~/adapter";
import { useCloudStore } from "~/stores/cloud";
import { useConfigStore } from "~/stores/config";
import { captureMetric } from "~/util/metrics";
import { getCloudEndpoints } from "./endpoints";

export interface APIRequestInit extends RequestInit {
	management?: boolean;
}

/**
 * Execute a fetch request against the API and returns
 * the JSON response
 */
export async function fetchAPI<T = unknown>(
	path: string,
	options?: APIRequestInit | undefined,
): Promise<T> {
	const { sessionToken } = useCloudStore.getState();
	const { apiBase, mgmtBase } = getCloudEndpoints();

	const baseUrl = options?.management ? mgmtBase : apiBase;
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};

	if (sessionToken) {
		headers.Authorization = `Bearer ${sessionToken}`;
	}

	const response = await adapter.fetch(`${baseUrl}${path}`, {
		headers: {
			...headers,
			...options?.headers,
		},
		...options,
	});

	if (!response.ok) {
		const isJson =
			response.headers.get("Content-Type")?.startsWith("application/json") ?? false;

		let reason = response.statusText;

		if (isJson) {
			const { message } = await response.json();
			reason = message;
		}

		captureMetric("cloud_api_error", {
			status: response.status,
			endpoint: path,
			message: reason,
		});

		throw new ApiError(response, reason);
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

	const [profile, instanceVersions, instanceTypes, regions, billingCountries] = await Promise.all(
		[
			fetchAPI<CloudProfile>("/user/profile"),
			fetchAPI<string[]>("/instanceversions"),
			fetchAPI<CloudInstanceType[]>("/instancetypes"),
			fetchAPI<CloudRegion[]>("/regions"),
			fetchAPI<CloudBillingCountry[]>("/billingcountries"),
		],
	);

	const organizations = await fetchAPI<CloudOrganization[]>(`/organizations`);
	const active = organizations.find((org) => org.id === activeCloudOrg);

	if (!active) {
		setActiveCloudOrg(profile.default_org);
	}

	setCloudValues({
		profile,
		instanceVersions,
		instanceTypes,
		regions,
		organizations,
		billingCountries,
	});
}

/**
 * Error response from the API
 */
export class ApiError extends Error {
	public reason: string;

	public constructor(response: Response, reason: string) {
		super(`Request failed for "${response.url}" (${response.status}): ${reason}`);

		this.reason = reason;
	}
}
