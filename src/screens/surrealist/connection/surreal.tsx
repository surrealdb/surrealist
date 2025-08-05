import Surreal from "surrealdb";

interface GraphqlQuery {
	query?: string;
	variables?: Record<string, any>;
	operationName?: string;
}

/**
 * Customized Surreal wrapper for handling custom logic
 */
class CustomSurreal extends Surreal {
	/**
	 * Execute a GraphQL query on the database
	 *
	 * @param query The query parameters
	 */
	public async graphql(query: GraphqlQuery) {
		const req: any = {};

		if (query.query) req.query = query.query;
		if (query.variables) req.variables = query.variables;
		if (query.operationName) req.operationName = query.operationName;

		return this.rpc("graphql", [req, { pretty: true }]);
	}
}

/**
 * Create a new placeholder Surreal instance
 */
export function createPlaceholder() {
	return new CustomSurreal();
}

export interface SurrealOptions {
	strict?: boolean;
}

/**
 * Create a new configured Surreal instance
 */
export async function createSurreal(options?: SurrealOptions) {
	const { surrealdbWasmEngines } = await import("@surrealdb/wasm");

	return new CustomSurreal({
		engines: surrealdbWasmEngines({
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
