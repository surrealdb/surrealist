import { adapter } from "~/adapter";
import { useCloudStore } from "~/stores/cloud";
import { useConfigStore } from "~/stores/config";
import { CloudProfile, CloudInstanceType, CloudRegion, CloudOrganization } from "~/types";
import { getSetting } from "~/util/config";

export interface APIRequestInit extends RequestInit {
	management?: boolean;
}

/**
 * Execute a fetch request against the API and returns
 * the JSON response
 */
export async function fetchAPI<T = unknown>(path: string, options?: APIRequestInit | undefined): Promise<T> {
	const { sessionToken } = useCloudStore.getState();

	const baseUrl = options?.management
		? getSetting("cloud", "urlApiMgmtBase")
		: getSetting("cloud", "urlApiBase");

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
		throw new ApiError(response);
	}

	return await response.json();
}

/**
 * Fetch essential information from the API
 */
export async function updateCloudInformation() {
	const { setCloudValues } = useCloudStore.getState();
	const { activeCloudOrg, setActiveCloudOrg } = useConfigStore.getState();

	const [profile, instanceTypes, regions] = await Promise.all([
		fetchAPI<CloudProfile>("/user/profile"),
		fetchAPI<CloudInstanceType[]>("/instancetypes"),
		fetchAPI<CloudRegion[]>("/regions"),
	]);

	const organization = await fetchAPI<CloudOrganization>(`/organizations/${profile.default_org}`);

	setCloudValues({
		profile,
		instanceTypes,
		regions,
		organizations: [organization]
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

}