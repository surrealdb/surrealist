import { getAccessToken } from "~/providers/Auth";
import { ApiError } from ".";
import { getApiBase } from "./endpoints";

/**
 * Execute a fetch request against the SurrealDB API
 * and returns the JSON response
 */
export async function fetchContextAPI<T = unknown>(
	path: string,
	environment: "production" | "staging",
	options?: RequestInit | undefined,
): Promise<T> {
	const apiBase = getApiBase();

	let token: string | null = null;

	try {
		token = await getAccessToken();
	} catch {
		// Token unavailable
	}

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};

	if (token) {
		headers.Authorization = `Bearer ${token}`;
		headers["X-SurrealDB-Cloud-Environment"] = environment;
	}

	try {
		const response = await fetch(`${apiBase}${path}`, {
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
		throw new Error(`Failed API request to ${apiBase}${path}: ${err}`);
	}

	// If we reach here, the response was not JSON, which is unexpected
	throw new Error(`Unexpected response format from ${apiBase}${path}`);
}
