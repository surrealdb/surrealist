import { Surreal } from "surrealdb";

export interface SurrealOptions {
	strict?: boolean;
}

/**
 * Create a new configured Surreal instance
 */
export async function createSurreal(options?: SurrealOptions) {
	const { createWasmEngines } = await import("@surrealdb/wasm");

	return new Surreal({
		engines: createWasmEngines({
			strict: options?.strict,
			capabilities: {
				experimental: true,
				functions: true,
				guest_access: true,
				live_query_notifications: true,
				network_targets: true,
			},
		}),
	});
}
