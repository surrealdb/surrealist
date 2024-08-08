import Surreal from "surrealdb.js";
import { surrealdbWasmEngines } from "surrealdb.wasm";

interface GraphqlQuery {
	query: string;
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

		console.log(req);

		const res = await this.rpc("graphql", [req, { pretty: true }]);

		return res;
	}

}

export function createSurreal() {
	const sdb = new CustomSurreal({
		engines: surrealdbWasmEngines({
			capabilities: true,
		})
	});

	(window as any).surreal = sdb;

	return sdb;
}