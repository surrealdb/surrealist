import { Box } from "@mantine/core";
import { useMemo } from "react";
import {
	Article,
	DocsPreview,
	TableTitle,
} from "~/screens/surrealist/pages/Connection/docs/components";
import { useDocsTable } from "~/screens/surrealist/pages/Connection/docs/hooks/table";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsTablesInsertingRecords({ language }: TopicProps) {
	const table = useDocsTable();
	const tableName = table.schema.name;

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
-- Insert a single record
INSERT INTO ${tableName} { name: "Tobie" };

-- Insert multiple records
INSERT INTO ${tableName} [
	{ name: "Tobie" },
	{ name: "Jaime" },
];
`,
			js: `
import { Table } from 'surrealdb';

// Insert a single record
await db.insert(new Table('${tableName}'), { name: 'Tobie' });

// Insert multiple records
await db.insert(new Table('${tableName}'), [
	{ name: 'Tobie' },
	{ name: 'Jaime' },
]);
`,
			rust: `
// Insert a single record
db.insert("${tableName}")
	.content(Person { name: "Tobie".into() })
	.await?;

// Insert multiple records
db.insert("${tableName}")
	.content(vec![
		Person { name: "Tobie".into() },
		Person { name: "Jaime".into() },
	])
	.await?;
`,
			py: `
# Insert a single record
await db.insert('${tableName}', {"name": "Tobie"})

# Insert multiple records
await db.insert('${tableName}', [
	{"name": "Tobie"},
	{"name": "Jaime"},
])
`,
			go: `
import "github.com/surrealdb/surrealdb.go/pkg/models"

// Insert a single record
_, err := surrealdb.Insert[Person](ctx, db,
	models.Table("${tableName}"),
	map[string]any{"name": "Tobie"},
)

// Insert multiple records
_, err = surrealdb.Insert[[]Person](ctx, db,
	models.Table("${tableName}"),
	[]map[string]any{
		{"name": "Tobie"},
		{"name": "Jaime"},
	},
)
`,
			csharp: `
await db.Insert("${tableName}", new { name = "Tobie" });

await db.Insert("${tableName}", new[]
{
	new { name = "Tobie" },
	new { name = "Jaime" },
});
`,
			java: `
List<Value> inserted = db.insert("${tableName}", recordOne, recordTwo);
`,
			php: `
$db->insert("${tableName}", ["name" => "Tobie"]);

$db->insert("${tableName}", [
	["name" => "Tobie"],
	["name" => "Jaime"],
]);
`,
		}),
		[tableName],
	);

	return (
		<Article
			title={
				<TableTitle
					title="Inserting records"
					table={tableName}
				/>
			}
		>
			<Box component="p">
				Insert one or more records into <b>{tableName}</b>. Unlike <code>CREATE</code>,{" "}
				<code>INSERT</code> adds content to existing tables without generating new record
				IDs when omitted.
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Insert records"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
