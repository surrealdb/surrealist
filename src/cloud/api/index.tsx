import { getCloudSessionToken } from "~/providers/Cloud";
import { getCloudEndpoints } from "./endpoints";

/**
 * Execute a fetch request against the API and returns
 * the JSON response
 */
export async function fetchAPI<T = unknown>(
	path: string,
	options?: RequestInit | undefined,
): Promise<T> {
	const sessionToken = getCloudSessionToken();
	const { apiBase } = getCloudEndpoints();
	const { headers: extraHeaders, ...restOptions } = options || {};

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};

	if (sessionToken) {
		headers.Authorization = `Bearer ${sessionToken}`;
	}

	try {
		const response = await fetch(`${apiBase}${path}`, {
			headers: {
				...headers,
				...extraHeaders,
			},
			...restOptions,
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
		if (err instanceof ApiError) {
			throw err;
		}

		throw new Error(`Failed API request to ${apiBase}${path}: ${err}`);
	}

	return {} as T;
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
