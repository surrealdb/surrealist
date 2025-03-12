import { selectable } from "~/util/helpers";

/**
 * RPC methods
 */
export const RPC_TARGETS = selectable([
	"use",
	"info",
	"version",
	"signup",
	"signin",
	"authenticate",
	"invalidate",
	"let",
	"unset",
	"live",
	"kill",
	"query",
	"graphql",
	"run",
	"select",
	"create",
	"insert",
	"insert_relation",
	"update",
	"upsert",
	"relate",
	"merge",
	"patch",
	"delete",
]);

/**
 * HTTP endpoints
 */
export const ENDPOINT_TARGETS = selectable([
	"status",
	"version",
	"import",
	"export",
	"signup",
	"signin",
	"key",
	"sql",
	"graphql",
	"ml",
]);

/**
 * SurrealDB experiments
 */
export const EXPERIMENT_TARGETS = selectable([
	"record_references",
	"graphql",
	"bearer_access",
	"define_api",
]);

/**
 * Arbitrary query targets
 */
export const ARBITRARY_QUERY_TARGETS = selectable(["guest", "record", "system"]);
