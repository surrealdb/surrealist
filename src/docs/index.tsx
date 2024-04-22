import { newId } from "~/util/helpers";
import { DocsTopic } from "./types";
import { DatabaseSchema } from "~/types";
import { DocsGlobalIntroduction } from "./topics/global/introduction";
import { DocsGlobalInit } from "./topics/global/initialize";
import { DocsGlobalConnecting } from "./topics/global/connecting";
// import { DocsGlobalHandlingErrors } from "./topics/global/handling-errors";
import { DocsGlobalNamespaces } from "./topics/global/namespaces";
import { DocsGlobalDatabases } from "./topics/global/databases";
// import {DocsGlobalAuthentication} from "./topics/global/authentication";
// import {DocsGlobalSystemUsers} from "./topics/global/system-users";
import {DocsAuthSignUp} from "./topics/authentication/sign-up";
import {DocsAuthSignIn} from "./topics/authentication/sign-in";
import {DocsAuthTokens} from "./topics/authentication/tokens";
import {DocsAuthAccessUserData} from "./topics/authentication/access-user-data";
import {DocsSchemaParams} from "./topics/schema/params";
import {DocsSchemaScopes} from "./topics/schema/scopes";
import {DocsSchemaUsers} from "./topics/schema/users";
import {DocsSchemaFunctions} from "./topics/schema/functions";
import {DocsSchemaAnalyzers} from "./topics/schema/analyzers";
import {DocsTablesIntroduction} from "./topics/tables/introduction";
import {DocsTablesSelect} from "./topics/tables/select";
import {DocsTablesSelectAllFields} from "./topics/tables/select-all-fields";
import {DocsTablesCreatingRecords} from "./topics/tables/creating-records";
import {DocsTablesInsertingRecords} from "./topics/tables/inserting-records";
import {DocsTablesUpdatingRecords} from "./topics/tables/updating-records";
import {DocsTablesDeletingRecords} from "./topics/tables/deleting-records";
import {DocsTablesLiveSelecting} from "./topics/tables/live-selecting";
import {DocsConceptsFullTextSearch} from "./topics/concepts/full-text-search";
import {DocsConceptsSurrealML} from "./topics/concepts/surrealml";
import { iconAuth, iconBook, iconDesigner, iconStar, iconTable } from "~/util/icons";


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
			title: "Initialises",
			component: DocsGlobalInit,
			excludeLanguages: ['cli']
		},
		{
			id: newId(),
			title: "Connecting",
			component: DocsGlobalConnecting
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
			component: DocsGlobalNamespaces
		},
		{
			id: newId(),
			title: "Databases",
			component: DocsGlobalDatabases
		},
		{
			id: newId(),
			title: "Authentication",
			icon: iconAuth,
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
					excludeLanguages: ['cli']
				},
				{
					id: newId(),
					title: "Sign in",
					component: DocsAuthSignIn
				},
				{
					id: newId(),
					title: "Tokens",
					component: DocsAuthTokens,
					excludeLanguages: ['cli']
				},
				{
					id: newId(),
					title: "Access user data",
					component: DocsAuthAccessUserData,
					excludeLanguages: ['rust', 'py', 'go','java']
				}
			]
		},
		{
			id: newId(),
			title: "Schema",
			icon: iconDesigner,
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
					component: DocsSchemaParams
				},
				{
					id: newId(),
					title: "Scopes",
					component: DocsSchemaScopes,
					excludeLanguages: ['rust', 'py', 'go','java','js','php']
				},
				{
					id: newId(),
					title: "Users",
					component: DocsSchemaUsers,
					excludeLanguages: ['rust', 'py', 'go','java','js','php']
				},
				{
					id: newId(),
					title: "Functions",
					component: DocsSchemaFunctions,
					excludeLanguages: ['rust', 'py', 'go','java','js','php']
				},
				{
					id: newId(),
					title: "Analyzers",
					component: DocsSchemaAnalyzers,
					excludeLanguages: ['rust', 'py', 'go','java']
				}
			]
		},
		{
			id: newId(),
			title: `Tables`,
			icon: iconTable,
			topics: [
				{
					id: newId(),
					title: "Introduction",
					component: DocsTablesIntroduction,
				},
				...schema.tables.map(table => ({
					id: newId(),
					title: `${table.schema.name}`,
					children: [
						// {
						// 	id: newId(),
						// 	title: "Table information",
						// 	component: DocsTablesInfo,
						// 	extra: { table }
						// },
						{
							id: newId(),
							title: "Selecting fields",
							component: DocsTablesSelect,
							extra: { table }
						},
						{
							id: newId(),
							title: "Selecting all fields",
							component: DocsTablesSelectAllFields,
							extra: { table }
						},
						{
							id: newId(),
							title: "Creating records",
							component: DocsTablesCreatingRecords,
							extra: { table }
						},
						{
							id: newId(),
							title: "Inserting records",
							component: DocsTablesInsertingRecords,
							extra: { table }
						},
						{
							id: newId(),
							title: "Updating records",
							component: DocsTablesUpdatingRecords,
							extra: { table }
						},
						{
							id: newId(),
							title: "Deleting records",
							component: DocsTablesDeletingRecords,
							extra: { table }
						},
						{
							id: newId(),
							title: "Live selecting",
							component: DocsTablesLiveSelecting,
							extra: { table }
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
					]
				})),
			]
		},
		{
			id: newId(),
			title: "Concepts",
			icon: iconStar,
			topics: [
				{
					id: newId(),
					title: "Full-text search",
					component: DocsConceptsFullTextSearch
				},
				// {
				// 	id: newId(),
				// 	title: "Graph traversal",
				// 	component: DocsGlobalGraphTraversal
				// },
				{
					id: newId(),
					title: "SurrealML",
					component: DocsConceptsSurrealML
				}
			]
		},
		{
			id: newId(),
			title: "Learn more",
			icon: iconBook,
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
