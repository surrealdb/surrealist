import type {
	CloudBillingCountry,
	CloudInstanceType,
	CloudOrganization,
	CloudProfile,
	CloudRegion,
} from "~/types";

import { adapter } from "~/adapter";
import { useCloudStore } from "~/stores/cloud";
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

	try {
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

			throw new ApiError(response, reason);
		}

		if (response.headers.get("Content-Type")?.startsWith("application/json")) {
			return await response.json();
		}
	} catch (err) {
		throw new Error(`Failed API request to ${baseUrl}${path}: ${err}`);
	}

	return {} as T;
}

/**
 * Fetch essential information from the API
 */
export async function updateCloudInformation() {
	const { setCloudValues, setProfile } = useCloudStore.getState();

	// Load essential information
	const [instanceVersions, instanceTypes, regions, billingCountries] = await Promise.all([
		fetchAPI<string[]>("/instanceversions"),
		fetchAPI<CloudInstanceType[]>("/instancetypes"),
		fetchAPI<CloudRegion[]>("/regions"),
		fetchAPI<CloudBillingCountry[]>("/billingcountries"),
	]);

	const organizations = await fetchAPI<CloudOrganization[]>(`/organizations`);

	setCloudValues({
		instanceVersions,
		instanceTypes,
		regions,
		organizations,
		billingCountries,
	});

	// Load optional information
	const [profile] = await Promise.all([fetchAPI<CloudProfile>("/user/profile")]);

	setProfile(profile);
}

/**
 * Error response from the API
 */
export class ApiError extends Error {
	public status: number;
	public reason: string;

	public constructor(response: Response, reason: string) {
		super(`Request failed for "${response.url}" (${response.status}): ${reason}`);

		this.status = response.status;
		this.reason = reason;
	}
}
