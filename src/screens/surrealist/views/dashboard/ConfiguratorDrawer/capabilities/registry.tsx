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
export const ENDPOINT_TARGETS = [
	{ label: "Status", value: "status" },
	{ label: "Version", value: "version" },
	{ label: "Import", value: "import" },
	{ label: "Export", value: "export" },
	{ label: "Signup", value: "signup" },
	{ label: "Signin", value: "signin" },
	{ label: "Key", value: "key" },
	{ label: "SQL", value: "sql" },
	{ label: "GraphQL", value: "graphql" },
	{ label: "ML", value: "ml" },
];

/**
 * SurrealDB experiments
 */
export const EXPERIMENT_TARGETS = [
	{ label: "Record references", value: "record_references" },
	{ label: "GraphQL", value: "graphql" },
	{ label: "Bearer access", value: "bearer_access" },
	{ label: "Define API", value: "define_api" },
];

/**
 * Arbitrary query targets
 */
export const ARBITRARY_QUERY_TARGETS = selectable(["guest", "record", "system"]);
