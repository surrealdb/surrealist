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
		documentationUrl:
			"https://surrealdb.com/docs/surrealdb/installation/upgrading/migrating-data-to-3x/#1-futures-replaced-with-computed-fields",
	},
	"stored closure": {
		label: "Stored closure",
		documentationUrl:
			"https://surrealdb.com/docs/surrealdb/installation/upgrading/migrating-data-to-3x/#10-stored-closures",
	},
	"all idiom": {
		label: "All idiom",
		documentationUrl:
			"https://surrealdb.com/docs/surrealdb/installation/upgrading/migrating-data-to-3x/#13-all-idiom--behavior",
	},
	"field idiom followed": {
		label: "Field idiom followed",
		documentationUrl:
			"https://surrealdb.com/docs/surrealdb/installation/upgrading/migrating-data-to-3x/#14-field-idiom-followed-by-another-idiom-part",
	},
	"function logical_and": {
		label: "Function array::logical_and",
		documentationUrl:
			"https://surrealdb.com/docs/surrealdb/installation/upgrading/migrating-data-to-3x/#23-arraylogical_and-behavior",
	},
	"function logical_or": {
		label: "Function array::logical_or",
		documentationUrl:
			"https://surrealdb.com/docs/surrealdb/installation/upgrading/migrating-data-to-3x/#24-arraylogical_or-behavior",
	},
	"function math::sqrt": {
		label: "Function math::sqrt()",
		documentationUrl:
			"https://surrealdb.com/docs/surrealdb/installation/upgrading/migrating-data-to-3x/#20-mathsqrt-returns-nan",
	},
	"function math::min": {
		label: "Function math::min()",
		documentationUrl:
			"https://surrealdb.com/docs/surrealdb/installation/upgrading/migrating-data-to-3x/#21-mathmin-returns-infinity",
	},
	"function math::max": {
		label: "Function math::max()",
		documentationUrl:
			"https://surrealdb.com/docs/surrealdb/installation/upgrading/migrating-data-to-3x/#22-mathmax-returns--infinity",
	},
	"mock value": {
		label: "Mock value",
		documentationUrl:
			"https://surrealdb.com/docs/surrealdb/installation/upgrading/migrating-data-to-3x/#25-mock-value-type-changes",
	},
	"number key ordering": {
		label: "Number key ordering",
		documentationUrl:
			"https://surrealdb.com/docs/surrealdb/installation/upgrading/migrating-data-to-3x/#20-numeric-record-id-ordering",
	},
	"id field": {
		label: "ID field",
		documentationUrl:
			"https://surrealdb.com/docs/surrealdb/installation/upgrading/migrating-data-to-3x/#26-id-field-special-behavior",
	},
	"search index": {
		label: "Search index",
		documentationUrl:
			"https://surrealdb.com/docs/surrealdb/installation/upgrading/migrating-data-to-3x/#7-search-analyzer--fulltext-analyzer",
	},
	"analyze statement": {
		label: "Analyze statement",
		documentationUrl:
			"https://surrealdb.com/docs/surrealdb/installation/upgrading/migrating-data-to-3x/#12-usage-of-analyze-statement",
	},
	"record references": {
		label: "Record references",
		documentationUrl:
			"https://surrealdb.com/docs/surrealdb/installation/upgrading/migrating-data-to-3x/#11-usage-of-record-references",
	},
	"like operator": {
		label: "Like operator removal",
		documentationUrl:
			"https://surrealdb.com/docs/surrealdb/installation/upgrading/migrating-data-to-3x/#6-like-operators-removed",
	},
	"mtree index": {
		label: "Mtree index removal",
		documentationUrl:
			"https://surrealdb.com/docs/surrealdb/installation/upgrading/migrating-data-to-3x/#9-mtree-removal",
	},
};
