import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview, TableTitle } from "~/screens/surrealist/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/docs/types";
import { useDocsTable } from "../../hooks/table";

export function DocsTablesInsertingRecords({ language }: TopicProps) {
	const table = useDocsTable();

	const fieldName =
	table.fields.find(({ name }: { name: string }) => !["id", "in", "out"].includes(name))
		?.name ?? "id";

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
		INSERT INTO ${table.schema.name} {
			field: value
		};
		`,
			js: `
		await db.insert('${table.schema.name}', {
			field: value
		});
		`,
			rust: `
		db.update("${table.schema.name}").merge(Document {
        updated_at: Datetime::default(),
	}).await?;
		`,
			py: `
		# Insert a single record
db.insert('${table.schema.name}', {
	"name": 'Tobie',
	"settings": {
		"active": True,
		"marketing": True,
	},
})

# Insert multiple records
db.insert('${table.schema.name}', [
	{
		"name": 'Tobie',
		"settings": {
			"active": True,
			"marketing": True,
		},
	},
	{
		"name": 'Jaime',
		"settings": {
			"active": True,
			"marketing": True,
		},
	},
])
		`,
			go: `
		// Insert an entry
		person2, err := surrealdb.Insert[${fieldName}](db, models.Table("${table.schema.name}"), map[interface{}]interface{}{
			"Name":     "Jane",
			"Surname":  "Smith",
			"Location": models.NewGeometryPoint(-0.12, 22.01),
		})
		if err != nil {
			panic(err)
		}
		`,
			csharp: `
		await db.Merge("${table.schema.name}", data);
		`,
			java: `
		`,
			php: `
		$db->insert("${table.schema.name}", [
			["field" => "value"],
			["field" => "value"]
		]);
		`,
		}),
		[table.schema.name, fieldName],
	);

	return (
		<Article
			title={
				<TableTitle
					title="Inserting records"
					table={table.schema.name}
				/>
			}
		>
			<div>
				<p>
					Insert records into a table in the database. It could also be used to update
					existing fields in records within a table.
				</p>
			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Inserting Records"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
