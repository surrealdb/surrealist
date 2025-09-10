import { adapter } from "~/adapter";
import { TOKEN_ACCESS_KEY } from "~/util/storage";
import { ApiError } from ".";
import { getCloudEndpoints } from "./endpoints";

/**
 * Execute a fetch request against the ticketsAPI and returns
 * the JSON response
 */
export async function fetchContextAPI<T = unknown>(
	path: string,
	options?: RequestInit | undefined,
): Promise<T> {
	const { ticketsBase } = getCloudEndpoints();

	const token = localStorage.getItem(TOKEN_ACCESS_KEY);
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};

	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	try {
		const response = await adapter.fetch(`${ticketsBase}${path}`, {
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
