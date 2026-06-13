import { selectable } from "~/util/helpers";

// Mirrors the capability target enums in SurrealDB. Values here must match the
// strings accepted by these parsers, or the server will refuse to start:
//   - Method               (surrealdb/core/src/rpc/method.rs)
//   - RouteTarget          (surrealdb/core/src/dbs/capabilities.rs)
//   - ExperimentalTarget   (surrealdb/core/src/dbs/capabilities.rs)
//   - ArbitraryQueryTarget (surrealdb/core/src/dbs/capabilities.rs)

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
	// "refresh",
	"invalidate",
	// "revoke",
	// "reset",
	"let",
	"unset",
	"live",
	"kill",
	"query",
	"run",
	// "sessions",
	// "attach",
	// "detach",
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
	{ label: "Version", value: "version" },
	{ label: "Import", value: "import" },
	{ label: "Export", value: "export" },
	{ label: "Signup", value: "signup" },
	{ label: "Signin", value: "signin" },
	{ label: "Key", value: "key" },
	{ label: "SQL", value: "sql" },
	{ label: "GraphQL", value: "graphql" },
	{ label: "ML", value: "ml" },
	{ label: "API", value: "api" },
	{ label: "MCP", value: "mcp", since: "3.1.0" },
];

/**
 * SurrealDB experiments
 */
export const EXPERIMENT_TARGETS = [
	{ label: "GraphQL", value: "graphql", until: "3.0.0" },
	{ label: "Record references", value: "record_references", since: "2.2.0", until: "3.0.0" },
	{ label: "Bearer access", value: "bearer_access", since: "2.2.0", until: "3.0.0" },
	{ label: "Define API", value: "define_api", since: "2.2.0", until: "3.0.0" },
	// { label: "Surrealism", value: "surrealism", since: "3.0.0" }, // not yet supported in cloud
	// { label: "Files", value: "files", since: "3.0.0" }, // not yet supported in cloud
];

/**
 * Arbitrary query targets
 */
export const ARBITRARY_QUERY_TARGETS = selectable(["guest", "record", "system"]);
