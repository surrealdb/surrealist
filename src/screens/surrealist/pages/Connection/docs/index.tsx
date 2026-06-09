import {
	iconAPI,
	iconAuth,
	iconBook,
	iconDatabase,
	iconDesigner,
	iconPackageClosed,
	iconQuery,
	iconTable,
} from "@surrealdb/ui";
import type { ConnectionSchema } from "~/types";
import { newId } from "~/util/helpers";
import { DocsAuthAccessUserData } from "./topics/authentication/access-user-data";
import { DocsAuthSignIn } from "./topics/authentication/sign-in";
import { DocsAuthSignUp } from "./topics/authentication/sign-up";
import { DocsAuthTokens } from "./topics/authentication/tokens";
import { DocsConceptsFiles } from "./topics/concepts/files";
import { DocsConceptsFullTextSearch } from "./topics/concepts/full-text-search";
import { DocsConceptsGraphRelations } from "./topics/concepts/graph-relations";
import { DocsConceptsGraphTraversal } from "./topics/concepts/graph-traversal";
import { DocsDataModelsDocument } from "./topics/data-models/document-model";
import { DocsDataModelsGeospatial } from "./topics/data-models/geospatial";
import { DocsDataModelsRecordLinks } from "./topics/data-models/record-links";
import { DocsDataModelsTimeSeries } from "./topics/data-models/time-series";
import { DocsDataModelsVectorSearch } from "./topics/data-models/vector-search";
import { DocsExtensionsSurrealism } from "./topics/extensions/surrealism";
import { DocsGlobalConnecting } from "./topics/global/connecting";
import { DocsGlobalInit } from "./topics/global/initialize";
import { DocsGlobalIntroduction } from "./topics/global/introduction";
import { DocsGlobalNamespacesAndDatabases } from "./topics/global/namespaces-and-databases";
import { DocsGlobalQuerying } from "./topics/global/querying";
import { DocsQueryingChangefeeds } from "./topics/querying/changefeeds";
import { DocsQueryingGraphql } from "./topics/querying/graphql";
import { DocsSchemaAccess } from "./topics/schema/access";
import { DocsSchemaAnalyzers } from "./topics/schema/analyzers";
import { DocsSchemaComputedFields } from "./topics/schema/computed-fields";
import { DocsSchemaFunctions } from "./topics/schema/functions";
import { DocsSchemaParams } from "./topics/schema/params";
import { DocsSchemaUsers } from "./topics/schema/users";
import { DocsSdkImportExport } from "./topics/sdk/import-export";
import { DocsSdkMultipleSessions } from "./topics/sdk/multiple-sessions";
import { DocsSdkTransactions } from "./topics/sdk/transactions";
import { DocsTablesCreatingRecords } from "./topics/tables/creating-records";
import { DocsTablesDeletingRecords } from "./topics/tables/deleting-records";
import { DocsTablesInsertingRecords } from "./topics/tables/inserting-records";
import { DocsTablesIntroduction } from "./topics/tables/introduction";
import { DocsTablesLiveSelecting } from "./topics/tables/live-selecting";
import { DocsTablesSelect } from "./topics/tables/select";
import { DocsTablesSelectAllFields } from "./topics/tables/select-all-fields";
import { DocsTablesSelector } from "./topics/tables/selector";
import { DocsTablesUpdatingRecords } from "./topics/tables/updating-records";
import type { DocsTopic } from "./types";

/**
 * Build the structure of the documentation based on the given schema.
 */
export function buildDocumentation(_schema: ConnectionSchema): DocsTopic[] {
	return [
		{
			id: newId(),
			title: "Getting started",
			icon: iconBook,
			excludeLanguages: ["c"],
			topics: [
				{
					id: newId(),
					title: "Introduction",
					component: DocsGlobalIntroduction,
				},
				{
					id: newId(),
					title: "Initialising",
					component: DocsGlobalInit,
					excludeLanguages: ["cli"],
				},
				{
					id: newId(),
					title: "Connecting",
					component: DocsGlobalConnecting,
				},
				{
					id: newId(),
					title: "Namespaces and databases",
					component: DocsGlobalNamespacesAndDatabases,
				},
			],
		},
		{
			id: newId(),
			title: "Querying",
			icon: iconQuery,
			excludeLanguages: ["c"],
			topics: [
				{
					id: newId(),
					title: "SurrealQL queries",
					component: DocsGlobalQuerying,
				},
				{
					id: newId(),
					title: "Changefeeds",
					component: DocsQueryingChangefeeds,
				},
				{
					id: newId(),
					title: "GraphQL API",
					component: DocsQueryingGraphql,
				},
			],
		},
		{
			id: newId(),
			title: "Authentication",
			icon: iconAuth,
			excludeLanguages: ["c"],
			topics: [
				{
					id: newId(),
					title: "Sign in",
					component: DocsAuthSignIn,
				},
				{
					id: newId(),
					title: "Sign up",
					component: DocsAuthSignUp,
					excludeLanguages: ["cli"],
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
					excludeLanguages: ["rust", "py", "go", "c"],
				},
			],
		},
		{
			id: newId(),
			title: "Schema",
			icon: iconDesigner,
			excludeLanguages: ["c"],
			topics: [
				{
					id: newId(),
					title: "Access methods",
					component: DocsSchemaAccess,
					excludeLanguages: ["rust", "py", "go", "c", "js", "php"],
				},
				{
					id: newId(),
					title: "System users",
					component: DocsSchemaUsers,
					excludeLanguages: ["rust", "py", "go", "c", "js", "php"],
				},
				{
					id: newId(),
					title: "Parameters",
					component: DocsSchemaParams,
				},
				{
					id: newId(),
					title: "Functions",
					component: DocsSchemaFunctions,
					excludeLanguages: ["rust", "py", "go", "c", "js", "php"],
				},
				{
					id: newId(),
					title: "Analyzers",
					component: DocsSchemaAnalyzers,
					excludeLanguages: ["rust", "py", "go", "c"],
				},
				{
					id: newId(),
					title: "Computed fields",
					component: DocsSchemaComputedFields,
					excludeLanguages: ["rust", "py", "go", "c", "js", "php"],
				},
			],
		},
		{
			id: newId(),
			title: "Tables",
			icon: iconTable,
			excludeLanguages: ["c"],
			component: DocsTablesSelector,
			topics: [
				{
					id: newId(),
					title: "Introduction",
					component: DocsTablesIntroduction,
				},
				{
					id: newId(),
					title: "Selecting all fields",
					component: DocsTablesSelectAllFields,
				},
				{
					id: newId(),
					title: "Selecting fields",
					component: DocsTablesSelect,
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
					title: "Live queries",
					component: DocsTablesLiveSelecting,
					excludeLanguages: ["php"],
				},
			],
		},
		{
			id: newId(),
			title: "Data models",
			icon: iconDatabase,
			excludeLanguages: ["c"],
			topics: [
				{
					id: newId(),
					title: "Document model",
					component: DocsDataModelsDocument,
				},
				{
					id: newId(),
					title: "Record links",
					component: DocsDataModelsRecordLinks,
				},
				{
					id: newId(),
					title: "Graph relations",
					component: DocsConceptsGraphRelations,
				},
				{
					id: newId(),
					title: "Graph traversal",
					component: DocsConceptsGraphTraversal,
				},
				{
					id: newId(),
					title: "Full-text search",
					component: DocsConceptsFullTextSearch,
				},
				{
					id: newId(),
					title: "Geospatial",
					component: DocsDataModelsGeospatial,
					excludeLanguages: ["php"],
				},
				{
					id: newId(),
					title: "Time series",
					component: DocsDataModelsTimeSeries,
				},
				{
					id: newId(),
					title: "Vector search",
					component: DocsDataModelsVectorSearch,
				},
				{
					id: newId(),
					title: "Files",
					component: DocsConceptsFiles,
				},
			],
		},
		{
			id: newId(),
			title: "Extensions",
			icon: iconPackageClosed,
			excludeLanguages: ["c"],
			topics: [
				{
					id: newId(),
					title: "Surrealism plugins",
					component: DocsExtensionsSurrealism,
				},
			],
		},
		{
			id: newId(),
			title: "SDK",
			icon: iconAPI,
			excludeLanguages: ["c"],
			topics: [
				{
					id: newId(),
					title: "Transactions",
					component: DocsSdkTransactions,
				},
				{
					id: newId(),
					title: "Multiple sessions",
					component: DocsSdkMultipleSessions,
					excludeLanguages: ["cli", "rust", "php"],
				},
				{
					id: newId(),
					title: "Import and export",
					component: DocsSdkImportExport,
				},
			],
		},
		{
			id: newId(),
			title: "Learn more",
			icon: iconBook,
			excludeLanguages: ["c"],
			topics: [
				{
					id: newId(),
					title: "Documentation",
					link: "https://surrealdb.com/docs/",
				},
				{
					id: newId(),
					title: "SurrealQL reference",
					link: "https://surrealdb.com/docs/reference/query-language",
				},
				{
					id: newId(),
					title: "SDK integration",
					link: "https://surrealdb.com/docs/learn/querying/surrealql/executing-queries/via-sdks",
				},
				{
					id: newId(),
					title: "Java SDK",
					link: "https://surrealdb.com/docs/languages/java",
				},
				{
					id: newId(),
					title: "Extensions guide",
					link: "https://surrealdb.com/docs/learn/extensions/plugins/overview",
				},
				{
					id: newId(),
					title: "Migration guide",
					link: "https://surrealdb.com/docs/build/migrating/from-old-surrealdb-versions/2x-to-3x",
				},
			],
		},
	];
}
