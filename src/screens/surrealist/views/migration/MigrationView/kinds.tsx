import { MigrationKind } from "~/types";

export const kindMeta: Record<
	MigrationKind,
	{
		label: string;
		documentationUrl: string;
	}
> = {
	"incompatible future": {
		label: "Incompatible future",
		documentationUrl: "https://surrealdb.com/docs/migrations/incompatible-future",
	},
	"stored closure": {
		label: "Stored closure",
		documentationUrl: "https://surrealdb.com/docs/migrations/stored-closure",
	},
	"all idiom": {
		label: "All idiom",
		documentationUrl: "https://surrealdb.com/docs/migrations/all-idiom",
	},
	"field idiom followed": {
		label: "Field idiom followed",
		documentationUrl: "https://surrealdb.com/docs/migrations/field-idiom-followed",
	},
	"function logical_and": {
		label: "Function array::logical_and",
		documentationUrl: "https://surrealdb.com/docs/migrations/function-logical-and",
	},
	"function logical_or": {
		label: "Function array::logical_or",
		documentationUrl: "https://surrealdb.com/docs/migrations/function-logical-or",
	},
	"function math::sqrt": {
		label: "Function math::sqrt()",
		documentationUrl: "https://surrealdb.com/docs/migrations/function-math-sqrt",
	},
	"function math::min": {
		label: "Function math::min()",
		documentationUrl: "https://surrealdb.com/docs/migrations/function-math-min",
	},
	"function math::max": {
		label: "Function math::max()",
		documentationUrl: "https://surrealdb.com/docs/migrations/function-math-max",
	},
	"mock value": {
		label: "Mock value",
		documentationUrl: "https://surrealdb.com/docs/migrations/mock-value",
	},
	"number key ordering": {
		label: "Number key ordering",
		documentationUrl: "https://surrealdb.com/docs/migrations/number-key-ordering",
	},
	"id field": {
		label: "ID field",
		documentationUrl: "https://surrealdb.com/docs/migrations/id-field",
	},
	"search index": {
		label: "Search index",
		documentationUrl: "https://surrealdb.com/docs/migrations/search-index",
	},
};
