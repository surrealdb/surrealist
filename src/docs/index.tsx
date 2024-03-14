import { newId } from "~/util/helpers";
import { DocsTopic } from "./types";
import { DatabaseSchema } from "~/types";
import { DocsGlobalIntroduction } from "./topics/global/introduction";
import { DocsGlobalConnecting } from "./topics/global/connecting";

/**
 * Build the structure of the documentation based on the given schema.
 *
 * @param schema The schema to build the documentation for.
 * @returns The structure of the documentation.
 */
export function buildDocumentation(schema: DatabaseSchema): DocsTopic[] {
	return [
		{
			id: newId(),
			title: "Introduction",
			component: DocsGlobalIntroduction
		},
		{
			id: newId(),
			title: "Connecting",
			component: DocsGlobalConnecting
		},
		{
			id: newId(),
			title: "Handling errors",
			component: DocsGlobalConnecting
		},
		{
			id: newId(),
			title: "Namespaces",
			component: DocsGlobalConnecting
		},
		{
			id: newId(),
			title: "Databases",
			component: DocsGlobalConnecting
		},
		{
			id: newId(),
			title: "Authentication",
			topics: [
				{
					id: newId(),
					title: "Introduction",
					component: DocsGlobalConnecting
				},
				{
					id: newId(),
					title: "System users",
					component: DocsGlobalConnecting
				},
				{
					id: newId(),
					title: "Sign up",
					component: DocsGlobalConnecting
				},
				{
					id: newId(),
					title: "Sign in",
					component: DocsGlobalConnecting
				},
				{
					id: newId(),
					title: "Tokens",
					component: DocsGlobalConnecting
				},
				{
					id: newId(),
					title: "Access user data",
					component: DocsGlobalConnecting
				}
			]
		},
		{
			id: newId(),
			title: "Schema",
			topics: [
				{
					id: newId(),
					title: "Introduction",
					component: DocsGlobalConnecting
				},
				{
					id: newId(),
					title: "Tables",
					component: DocsGlobalConnecting
				},
				{
					id: newId(),
					title: "Params",
					component: DocsGlobalConnecting
				},
				{
					id: newId(),
					title: "Scopes",
					component: DocsGlobalConnecting
				},
				{
					id: newId(),
					title: "Users",
					component: DocsGlobalConnecting
				},
				{
					id: newId(),
					title: "Functions",
					component: DocsGlobalConnecting
				},
				{
					id: newId(),
					title: "Analyzers",
					component: DocsGlobalConnecting
				}
			]
		},
		{
			id: newId(),
			title: "Tables",
			topics: [
				{
					id: newId(),
					title: "Introduction",
					component: DocsGlobalConnecting
				},
				...schema.tables.map(table => {
					return {
						id: newId(),
						title: table.schema.name,
						children: [
							{
								id: newId(),
								title: "Selecting fields",
								component: DocsGlobalConnecting,
								extra: { table }
							},
							{
								id: newId(),
								title: "Selecting all fields",
								component: DocsGlobalConnecting,
								extra: { table }
							},
							{
								id: newId(),
								title: "Creating records",
								component: DocsGlobalConnecting,
								extra: { table }
							},
							{
								id: newId(),
								title: "Inserting records",
								component: DocsGlobalConnecting,
								extra: { table }
							},
							{
								id: newId(),
								title: "Updating records",
								component: DocsGlobalConnecting,
								extra: { table }
							},
							{
								id: newId(),
								title: "Deleting records",
								component: DocsGlobalConnecting,
								extra: { table }
							},
							{
								id: newId(),
								title: "Live selecting",
								component: DocsGlobalConnecting,
								extra: { table }
							},
							{
								id: newId(),
								title: "Manage indexes",
								component: DocsGlobalConnecting,
								extra: { table }
							},
							{
								id: newId(),
								title: "Manage fields",
								component: DocsGlobalConnecting,
								extra: { table }
							},
							{
								id: newId(),
								title: "Manage events",
								component: DocsGlobalConnecting,
								extra: { table }
							}
						]
					};
				})
			]
		},
		{
			id: newId(),
			title: "Concepts",
			topics: [
				{
					id: newId(),
					title: "Full-text search",
					component: DocsGlobalConnecting
				},
				{
					id: newId(),
					title: "Graph traversal",
					component: DocsGlobalConnecting
				},
				{
					id: newId(),
					title: "SurrealML",
					component: DocsGlobalConnecting
				}
			]
		},
		{
			id: newId(),
			title: "Learn more",
			topics: [
				{
					id: newId(),
					title: "Documentation",
					link: "https://surrealdb.com/docs/surrealdb/"
				},
				{
					id: newId(),
					title: "SurrealQL",
					link: "https://surrealdb.com/docs/surrealdb/surrealql/"
				},
				{
					id: newId(),
					title: "Integration",
					link: "https://surrealdb.com/docs/surrealdb/integration/"
				}
			]
		}
	];
}