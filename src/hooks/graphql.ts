import {
	type GraphQLSchema,
	buildClientSchema,
	getIntrospectionQuery,
} from "graphql";
import { useState } from "react";
import { sendGraphqlRequest } from "~/screens/database/connection/connection";
import { useStable } from "./stable";

/**
 * Returns an introspection function which can be used to introspect the
 * GraphQL schema of the currently selected database.
 */
export function useGraphqlIntrospection() {
	const [schema, setSchema] = useState<GraphQLSchema | null>(null);

	const introspectSchema = useStable(async () => {
		try {
			const query = getIntrospectionQuery();
			const response = await sendGraphqlRequest(query, {});

			if (!response.success) {
				console.warn("Failed to introspect GraphQL schema", response.result);
				setSchema(null);
				return;
			}

			const result = JSON.parse(response.result);
			const schema = buildClientSchema(result.data);

			setSchema(schema);
		} catch (err: any) {
			console.warn("Failed to introspect GraphQL schema", err);
			setSchema(null);
		}
	});

	return [schema, introspectSchema] as const;
}
