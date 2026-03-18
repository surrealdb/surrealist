import { getAccessToken } from "~/cloud/auth0-provider";
import { ApiError } from ".";
import { getCloudEndpoints } from "./endpoints";

/**
 * Execute a fetch request against the context API for the
 * tickets bridge and returns the JSON response
 */
export async function fetchContextAPI<T = unknown>(
	path: string,
	environment: "production" | "staging",
	options?: RequestInit | undefined,
): Promise<T> {
	const { ticketsBase } = getCloudEndpoints();

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};

	try {
		const token = await getAccessToken();
		headers.Authorization = `Bearer ${token}`;
		headers["X-SurrealDB-Cloud-Environment"] = environment;
	} catch {
		// Not authenticated
	}

	try {
		const response = await fetch(`${ticketsBase}${path}`, {
			headers: {
				...headers,
				...options?.headers,
			},
			...options,
		});

		const isJson =
			response.headers.get("Content-Type")?.startsWith("application/json") ?? false;

		if (!response.ok) {
			let reason = response.statusText;

			if (isJson) {
				const { message } = await response.json();
				reason = message;
			}

			throw new ApiError(response, reason);
		}

		if (isJson) {
			const json = await response.json();

			if (!json.success) {
				throw new ApiError(response, json.message);
			}

			return json.data;
		}
	} catch (err) {
		throw new Error(`Failed API request to ${ticketsBase}${path}: ${err}`);
	}

	// If we reach here, the response was not JSON, which is unexpected
	throw new Error(`Unexpected response format from ${ticketsBase}${path}`);
}
