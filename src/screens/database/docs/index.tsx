import type { ConnectionSchema } from "~/types";
import { newId } from "~/util/helpers";
import { iconAuth, iconBook, iconDesigner, iconStar, iconTable } from "~/util/icons";
import { DocsAuthAccessUserData } from "./topics/authentication/access-user-data";
import { DocsAuthSignIn } from "./topics/authentication/sign-in";
// import {DocsGlobalAuthentication} from "./topics/global/authentication";
// import {DocsGlobalSystemUsers} from "./topics/global/system-users";
import { DocsAuthSignUp } from "./topics/authentication/sign-up";
import { DocsAuthTokens } from "./topics/authentication/tokens";
import { DocsConceptsFullTextSearch } from "./topics/concepts/full-text-search";
import { DocsConceptsSurrealML } from "./topics/concepts/surrealml";
import { DocsGlobalConnecting } from "./topics/global/connecting";
import { DocsGlobalDatabases } from "./topics/global/databases";
import { DocsGlobalInit } from "./topics/global/initialize";
import { DocsGlobalIntroduction } from "./topics/global/introduction";
// import { DocsGlobalHandlingErrors } from "./topics/global/handling-errors";
import { DocsGlobalNamespaces } from "./topics/global/namespaces";
import { DocsSchemaAnalyzers } from "./topics/schema/analyzers";
import { DocsSchemaFunctions } from "./topics/schema/functions";
import { DocsSchemaParams } from "./topics/schema/params";
import { DocsSchemaScopes } from "./topics/schema/scopes";
import { DocsSchemaUsers } from "./topics/schema/users";
import { DocsTablesCreatingRecords } from "./topics/tables/creating-records";
import { DocsTablesDeletingRecords } from "./topics/tables/deleting-records";
import { DocsTablesInsertingRecords } from "./topics/tables/inserting-records";
import { DocsTablesIntroduction } from "./topics/tables/introduction";
import { DocsTablesLiveSelecting } from "./topics/tables/live-selecting";
import { DocsTablesSelect } from "./topics/tables/select";
import { DocsTablesSelectAllFields } from "./topics/tables/select-all-fields";
import { DocsTablesUpdatingRecords } from "./topics/tables/updating-records";
import type { DocsTopic } from "./types";
import { DocsTablesSelector } from "./topics/tables/selector";

/**
 * Build the structure of the documentation based on the given schema.
 *
 * @param schema The schema to build the documentation for.
 * @returns The structure of the documentation.
 */
export function buildDocumentation(schema: ConnectionSchema): DocsTopic[] {
	return [
		{
			id: newId(),
			title: "Introduction",
			component: DocsGlobalIntroduction,
		},
		{
			id: newId(),
			title: "Initialising",
			component: DocsGlobalInit,
			excludeLanguages: ["cli", "go", "java", "c"],
		},
		{
			id: newId(),
			title: "Connecting",
			component: DocsGlobalConnecting,
			excludeLanguages: ["go", "java", "c"],
		},
		// {
		// 	id: newId(),
		// 	title: "Handling errors",
		// 	component: DocsGlobalHandlingErrors,
		// 	languagesExclude: ['cli']
		// },
		{
			id: newId(),
			title: "Namespaces",
			component: DocsGlobalNamespaces,
			excludeLanguages: ["go", "java", "c"],
		},
		{
			id: newId(),
			title: "Databases",
			component: DocsGlobalDatabases,
			excludeLanguages: ["go", "java", "c"],
		},
		{
			id: newId(),
			title: "Authentication",
			icon: iconAuth,
			excludeLanguages: ["go", "java", "c"],
			topics: [
				// {
				// 	id: newId(),
				// 	title: "Introduction",
				// 	component: DocsGlobalAuthentication
				// },
				// {
				// 	id: newId(),
				// 	title: "System users",
				// 	component: DocsGlobalSystemUsers,
				// 	languagesExclude: ['cli']
				// },
				{
					id: newId(),
					title: "Sign up",
					component: DocsAuthSignUp,
					excludeLanguages: ["cli"],
				},
				{
					id: newId(),
					title: "Sign in",
					component: DocsAuthSignIn,
				},
				{
					id: newId(),
					title: "Tokens",
					component: DocsAuthTokens,
					excludeLanguages: ["cli"],
				},
				{
					id: newId(),
					title: "Access user data",
					component: DocsAuthAccessUserData,
					excludeLanguages: ["rust", "py", "go", "java", "c"],
				},
			],
		},
		{
			id: newId(),
			title: "Schema",
			icon: iconDesigner,
			excludeLanguages: ["go", "java", "c"],
			topics: [
				// {
				// 	id: newId(),
				// 	title: "Introduction",
				// 	component: DocsGlobalSchema
				// },
				// {
				// 	id: newId(),
				// 	title: "Tables",
				// 	component: DocsGlobalSchemaTables
				// },
				{
					id: newId(),
					title: "Params",
					component: DocsSchemaParams,
				},
				{
					id: newId(),
					title: "Scopes",
					component: DocsSchemaScopes,
					excludeLanguages: ["rust", "py", "go", "java", "c", "js"],
				},
				{
					id: newId(),
					title: "Users",
					component: DocsSchemaUsers,
					excludeLanguages: ["rust", "py", "go", "java", "c", "js", "php"],
				},
				{
					id: newId(),
					title: "Functions",
					component: DocsSchemaFunctions,
					excludeLanguages: ["rust", "py", "go", "java", "c", "js", "php"],
				},
				{
					id: newId(),
					title: "Analyzers",
					component: DocsSchemaAnalyzers,
					excludeLanguages: ["rust", "py", "go", "java", "c"],
				},
			],
		},
		{
			id: newId(),
			title: `Tables`,
			icon: iconTable,
			excludeLanguages: ["go", "java", "c"],
			component: DocsTablesSelector,
			topics: [
				{
					id: newId(),
					title: "Introduction",
					component: DocsTablesIntroduction,
				},
				{
					id: newId(),
					title: "Selecting fields",
					component: DocsTablesSelect,
				},
				{
					id: newId(),
					title: "Selecting all fields",
					component: DocsTablesSelectAllFields,
				},
				{
					id: newId(),
					title: "Creating records",
					component: DocsTablesCreatingRecords,
				},
				{
					id: newId(),
					title: "Inserting records",
					component: DocsTablesInsertingRecords,
				},
				{
					id: newId(),
					title: "Updating records",
					component: DocsTablesUpdatingRecords,
				},
				{
					id: newId(),
					title: "Deleting records",
					component: DocsTablesDeletingRecords,
				},
				{
					id: newId(),
					title: "Live selecting",
					component: DocsTablesLiveSelecting,
					excludeLanguages: ["php"],
				},

				// {
				// 	id: newId(),
				// 	title: "Manage indexes",
				// 	component: DocsTablesManageIndexes,
				// 	extra: { table }
				// },
				// {
				// 	id: newId(),
				// 	title: "Manage fields",
				// 	component: DocsTablesManageFields,
				// 	extra: { table }
				// },
				// {
				// 	id: newId(),
				// 	title: "Manage events",
				// 	component: DocsTablesManageEvents,
				// 	extra: { table }
				// }
			],
		},
		{
			id: newId(),
			title: "Concepts",
			icon: iconStar,
			excludeLanguages: ["go", "java", "c"],
			topics: [
				{
					id: newId(),
					title: "Full-text search",
					component: DocsConceptsFullTextSearch,
				},
				// {
				// 	id: newId(),
				// 	title: "Graph traversal",
				// 	component: DocsGlobalGraphTraversal
				// },
				{
					id: newId(),
					title: "SurrealML",
					component: DocsConceptsSurrealML,
				},
			],
		},
		{
			id: newId(),
			title: "Learn more",
			icon: iconBook,
			excludeLanguages: ["go", "java", "c"],
			topics: [
				{
					id: newId(),
					title: "Documentation",
					link: "https://surrealdb.com/docs/surrealdb/",
				},
				{
					id: newId(),
					title: "SurrealQL",
					link: "https://surrealdb.com/docs/surrealdb/surrealql/",
				},
				{
					id: newId(),
					title: "Integration",
					link: "https://surrealdb.com/docs/surrealdb/integration/",
				},
			],
		},
	];
}
