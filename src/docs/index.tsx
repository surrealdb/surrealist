import { newId } from "~/util/helpers";
import { DocsTopic } from "./types";
import { DatabaseSchema } from "~/types";
import { DocsGlobalIntroduction } from "./topics/global/introduction";
import { DocsGlobalInit } from "./topics/global/Initi";
import { DocsGlobalConnecting } from "./topics/global/connecting";
// import { DocsGlobalHandlingErrors } from "./topics/global/handling-errors";
import { DocsGlobalNamespaces } from "./topics/global/namespaces";
import { DocsGlobalDatabases } from "./topics/global/databases";
// import {DocsGlobalAuthentication} from "./topics/global/authentication";
// import {DocsGlobalSystemUsers} from "./topics/global/system-users";
import {DocsGlobalSignUp} from "./topics/global/sign-up";
import {DocsGlobalSignIn} from "./topics/global/sign-in";
import {DocsGlobalTokens} from "./topics/global/tokens";
import {DocsGlobalAccessUserData} from "./topics/global/access-user-data";
import {DocsGlobalSchema} from "./topics/global/schema";
import {DocsGlobalSchemaTables} from "./topics/global/schema-tables";
import {DocsGlobalSchemaParams} from "./topics/global/params";
import {DocsGlobalSchemaScopes} from "./topics/global/scopes";
import {DocsGlobalSchemaUsers} from "./topics/global/users";
import {DocsGlobalSchemaFunctions} from "./topics/global/functions";
import {DocsGlobalSchemaAnalyzers} from "./topics/global/schema-analyzers";
import {DocsGlobalTablesIntroduction} from "./topics/global/tables-introduction";
import {DocsGlobalTablesSelect} from "./topics/global/tables-select";
import {DocsGlobalTablesSelectAllFields} from "./topics/global/tables-select-all-fields";
import {DocsGlobalTablesCreatingRecords} from "./topics/global/tables-creating-records";
import {DocsGlobalTablesInsertingRecords} from "./topics/global/tables-inserting-records";
import {DocsGlobalTablesUpdatingRecords} from "./topics/global/tables-updating-records";
import {DocsGlobalTablesDeletingRecords} from "./topics/global/tables-deleting-records";
import {DocsGlobalTablesLiveSelecting} from "./topics/global/tables-live-selecting";
import {DocsGlobalTablesManageIndexes} from "./topics/global/tables-manage-indexes";
import {DocsGlobalTablesManageFields} from "./topics/global/tables-manage-fields";
import {DocsGlobalTablesManageEvents} from "./topics/global/tables-manage-events";
import {DocsGlobalFullTextSearch} from "./topics/global/concepts-full-text-search";
import {DocsGlobalGraphTraversal} from "./topics/global/concepts-graph-traversal";
import {DocsGlobalSurrealML} from "./topics/global/concepts-surrealml";


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
			languagesExclude: ['cli']
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
					component: DocsGlobalSignUp,
					languagesExclude: ['cli']
				},
				{
					id: newId(),
					title: "Sign in",
					component: DocsGlobalSignIn
				},
				{
					id: newId(),
					title: "Tokens",
					component: DocsGlobalTokens,
					languagesExclude: ['cli']
				},
				{
					id: newId(),
					title: "Access user data",
					component: DocsGlobalAccessUserData
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
					component: DocsGlobalSchema
				},
				{
					id: newId(),
					title: "Tables",
					component: DocsGlobalSchemaTables
				},
				{
					id: newId(),
					title: "Params",
					component: DocsGlobalSchemaParams
				},
				{
					id: newId(),
					title: "Scopes",
					component: DocsGlobalSchemaScopes
				},
				{
					id: newId(),
					title: "Users",
					component: DocsGlobalSchemaUsers
				},
				{
					id: newId(),
					title: "Functions",
					component: DocsGlobalSchemaFunctions
				},
				{
					id: newId(),
					title: "Analyzers",
					component: DocsGlobalSchemaAnalyzers
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
					component: DocsGlobalTablesIntroduction
				},
				{
					id: newId(),
					title: "Selecting fields",
					component: DocsGlobalTablesSelect,
				},
				{
					id: newId(),
					title: "Selecting all fields",
					component: DocsGlobalTablesSelectAllFields,
				},
				{
					id: newId(),
					title: "Creating records",
					component: DocsGlobalTablesCreatingRecords,
				},
				{
					id: newId(),
					title: "Inserting records",
					component: DocsGlobalTablesInsertingRecords,
				},
				{
					id: newId(),
					title: "Updating records",
					component: DocsGlobalTablesUpdatingRecords,
				},
				{
					id: newId(),
					title: "Deleting records",
					component: DocsGlobalTablesDeletingRecords,
				},
				{
					id: newId(),
					title: "Live selecting",
					component: DocsGlobalTablesLiveSelecting,
				},
				{
					id: newId(),
					title: "Manage indexes",
					component: DocsGlobalTablesManageIndexes,
				},
				{
					id: newId(),
					title: "Manage fields",
					component: DocsGlobalTablesManageFields,
				},
				{
					id: newId(),
					title: "Manage events",
					component: DocsGlobalTablesManageEvents,
				}
			]
		},
		{
			id: newId(),
			title: "Concepts",
			topics: [
				{
					id: newId(),
					title: "Full-text search",
					component: DocsGlobalFullTextSearch
				},
				{
					id: newId(),
					title: "Graph traversal",
					component: DocsGlobalGraphTraversal
				},
				{
					id: newId(),
					title: "SurrealML",
					component: DocsGlobalSurrealML
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
