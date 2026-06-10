import { MigrationKind } from "~/types";

const MIGRATION_DOC =
	"https://surrealdb.com/docs/build/migrating/from-old-surrealdb-versions/2x-to-3x";

export const kindMeta: Record<
	MigrationKind,
	{
		label: string;
		documentationUrl: string;
	}
> = {
	"incompatible future": {
		label: "Incompatible future",
		documentationUrl: `${MIGRATION_DOC}#1-futures-replaced-with-computed-fields`,
	},
	"stored closure": {
		label: "Stored closure",
		documentationUrl: `${MIGRATION_DOC}#10-stored-closures`,
	},
	"all idiom": {
		label: "All idiom",
		documentationUrl: `${MIGRATION_DOC}#13-all-idiom-behavior`,
	},
	"field idiom followed": {
		label: "Field idiom followed",
		documentationUrl: `${MIGRATION_DOC}#14-field-idiom-followed-by-another-idiom-part`,
	},
	"function logical_and": {
		label: "Function array::logical_and",
		documentationUrl: `${MIGRATION_DOC}#24-arraylogical_and-behavior`,
	},
	"function logical_or": {
		label: "Function array::logical_or",
		documentationUrl: `${MIGRATION_DOC}#25-arraylogical_or-behavior`,
	},
	"function math::sqrt": {
		label: "Function math::sqrt()",
		documentationUrl: `${MIGRATION_DOC}#21-mathsqrt-returns-nan`,
	},
	"function math::min": {
		label: "Function math::min()",
		documentationUrl: `${MIGRATION_DOC}#22-mathmin-returns-infinity`,
	},
	"function math::max": {
		label: "Function math::max()",
		documentationUrl: `${MIGRATION_DOC}#23-mathmax-returns-infinity`,
	},
	"mock value": {
		label: "Mock value",
		documentationUrl: `${MIGRATION_DOC}#26-mock-value-type-changes`,
	},
	"number key ordering": {
		label: "Number key ordering",
		documentationUrl: `${MIGRATION_DOC}#20-numeric-record-id-ordering`,
	},
	"id field": {
		label: "ID field",
		documentationUrl: `${MIGRATION_DOC}#27-id-field-special-behavior`,
	},
	"search index": {
		label: "Search index",
		documentationUrl: `${MIGRATION_DOC}#7-search-analyzer--fulltext-analyzer`,
	},
	"analyze statement": {
		label: "Analyze statement",
		documentationUrl: `${MIGRATION_DOC}#12-usage-of-analyze-statement`,
	},
	"record references": {
		label: "Record references",
		documentationUrl: `${MIGRATION_DOC}#11-usage-of-record-references`,
	},
	"like operator": {
		label: "Like operator removal",
		documentationUrl: `${MIGRATION_DOC}#6-like-operators-removed`,
	},
	"mtree index": {
		label: "Mtree index removal",
		documentationUrl: `${MIGRATION_DOC}#9-mtree-removal`,
	},
};
