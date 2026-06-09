import { Box } from "@mantine/core";
import { useMemo } from "react";
import {
	Article,
	DocsPreview,
	TableTitle,
} from "~/screens/surrealist/pages/Connection/docs/components";
import { useDocsTable } from "~/screens/surrealist/pages/Connection/docs/hooks/table";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsTablesIntroduction({ language }: TopicProps) {
	const table = useDocsTable();
	const tableName = table.schema.name;
	const isRelation = table.schema.kind.kind === "RELATION";
	const isView = !!table.schema.view;
	const isSchemafull = table.schema.schemafull ?? table.schema.full;

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
-- Inspect the table definition
INFO FOR TABLE ${tableName};

-- Define a schemafull table
DEFINE TABLE ${tableName} SCHEMAFULL;
`,
			js: `
import { Table } from 'surrealdb';

// Select all records from the table
const records = await db.select(new Table('${tableName}'));

// Get table info via SurrealQL
const info = await db.query('INFO FOR TABLE type::table($table)', {
	table: '${tableName}',
});
`,
			rust: `
let records: Vec<Value> = db.select("${tableName}").await?;

let info = db
	.query("INFO FOR TABLE type::table($table)")
	.bind(("table", "${tableName}"))
	.await?;
`,
			py: `
records = await db.select('${tableName}')

info = await db.query(
	"INFO FOR TABLE type::table($table)",
	{"table": "${tableName}"},
)
`,
			go: `
import "github.com/surrealdb/surrealdb.go/pkg/models"

records, err := surrealdb.Select[[]map[string]any](ctx, db,
	models.Table("${tableName}"),
)

info, err := surrealdb.Query[any](ctx, db,
	"INFO FOR TABLE type::table($table)",
	map[string]any{"table": "${tableName}"},
)
`,
			csharp: `
var records = await db.Select<dynamic>("${tableName}");

var info = await db.RawQuery(
	"INFO FOR TABLE type::table($table)",
	new Dictionary<string, object?> { { "table", "${tableName}" } },
);
`,
			java: `
Iterator<Person> records = db.select(Person.class, "${tableName}");

Response info = db.queryBind(
	"INFO FOR TABLE type::table($table)",
	Map.of("table", "${tableName}")
);
`,
			php: `
$records = $db->select("${tableName}");

$info = $db->query(
	"INFO FOR TABLE type::table($table)",
	["table" => "${tableName}"],
);
`,
		}),
		[tableName],
	);

	return (
		<Article
			title={
				<TableTitle
					title="Tables"
					table={tableName}
				/>
			}
		>
			<Box>
				<Box component="p">
					Tables store records in your database. The active table <b>{tableName}</b> is a{" "}
					{isView
						? "view"
						: isRelation
							? "relation"
							: isSchemafull
								? "schemafull"
								: "schemaless"}{" "}
					table with {table.fields.length} defined field
					{table.fields.length === 1 ? "" : "s"}. Use the topics below for CRUD operations
					personalised to this table.
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Table overview"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
