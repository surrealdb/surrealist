import { Box } from "@mantine/core";
import { useMemo } from "react";
import {
	Article,
	DocsPreview,
	TableTitle,
} from "~/screens/surrealist/pages/Connection/docs/components";
import { useDocsTable } from "~/screens/surrealist/pages/Connection/docs/hooks/table";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsTablesSelect({ language }: TopicProps) {
	const table = useDocsTable();
	const tableName = table.schema.name;

	const fieldName =
		table.fields.find(({ name }: { name: string }) => !["id", "in", "out"].includes(name))
			?.name ?? "name";

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
SELECT ${fieldName} FROM ${tableName};
`,
			js: `
import { Table } from 'surrealdb';

const records = await db.select(new Table('${tableName}'))
	.fields('${fieldName}');
`,
			rust: `
let names: Vec<String> = db
	.query("SELECT ${fieldName} FROM type::table($table)")
	.bind(("table", "${tableName}"))
	.await?
	.take(0)?;
`,
			py: `
result = await db.query(
	"SELECT $field FROM type::table($table)",
	{"field": "${fieldName}", "table": "${tableName}"},
)
`,
			go: `
results, err := surrealdb.Query[[]map[string]any](ctx, db,
	"SELECT $field FROM type::table($table)",
	map[string]any{"field": "${fieldName}", "table": "${tableName}"},
)
`,
			csharp: `
var result = await db.RawQuery(
	$"SELECT {fieldName} FROM type::table($table)",
	new Dictionary<string, object?> { { "table", "${tableName}" } },
);
`,
			java: `
List<Map<String, Object>> records = db.queryBind(
	"SELECT $field FROM type::table($table)",
	Map.of("field", "${fieldName}", "table", "${tableName}")
).take(List.class, 0);
`,
			php: `
$results = $db->query(
	"SELECT $field FROM type::table($table)",
	["field" => "${fieldName}", "table" => "${tableName}"],
);
`,
		}),
		[tableName, fieldName],
	);

	return (
		<Article
			title={
				<TableTitle
					title="Selecting fields"
					table={tableName}
				/>
			}
		>
			<Box component="p">
				Select specific fields from <b>{tableName}</b> instead of retrieving every column.
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Select fields"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
