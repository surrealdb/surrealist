import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview, TableTitle } from "~/docs/components";
import { getTable } from "~/docs/helpers";
import { Snippets, TopicProps } from "~/docs/types";

export function DocsTablesCreatingRecords({ language, topic }: TopicProps) {
	const table = getTable(topic);

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
		CREATE ${table.schema.name}:demo
		`,
			js: `
		db.create('${table.schema.name}');
		`,
			rust: `
		db.create("${table.schema.name}").await?;
		`,
			py: `
		db.create('${table.schema.name}')
		`,
			go: `
		db.Create("${table.schema.name}", map[string]interface{}{})
		`,
			csharp: `
		await db.Create("${table.schema.name}", data);
		`,
			java: `
		driver.create(thing, data)
		`,
			php: `
		$db->create("${table.schema.name}")
		`,
		}),
		[table.schema.name],
	);

	return (
		<Article
			title={<TableTitle title="Creating records" table={table.schema.name} />}
		>
			<p>
				Add a new record to the table<b> {table.schema.name} </b>. The record
				will have a random record ID if not specified after the table name. You
				can also specify the fields of the record.
			</p>
			<Box>
				<DocsPreview
					language={language}
					title="Creating Records"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
