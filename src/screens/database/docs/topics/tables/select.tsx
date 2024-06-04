import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview, TableTitle } from "~/screens/database/docs/components";
import { Snippets, TopicProps } from "~/screens/database/docs/types";
import { getTable } from "~/screens/database/docs/helpers";

export function DocsTablesSelect({ language, topic }: TopicProps) {
	const table = getTable(topic);
	const fieldName =
		table.fields.find(
			({ name }: { name: string }) => !["id", "in", "out"].includes(name)
		)?.name ?? "table:id";
	const tableName = topic.extra?.table?.schema?.name;

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
		SELECT ${fieldName} FROM ${tableName}
		`,
			js: `
		// Select a specific record from a table
		const [person] = await db.select('${fieldName}');
		`,
			rust: `

		`,
			py: `
		db.select('${fieldName}')
		`,
			go: `

		`,
			java: `
		driver.select("${fieldName}", rowType)
		`,
			php: `
		$record = new \\Surreal\\Cbor\\Types\\StringRecordId("${fieldName}");
		$db->select($record);
		`,
		}),
		[fieldName, tableName]
	);

	return (
		<Article
			title={
				<TableTitle
					title="Selecting individual fields"
					table={table.schema.name}
				/>
			}
		>
			<div>
				<p>
					Selecting fields operation is useful when you want to
					retrieve specific fields in a table without retrieving all
					the fields. To do this, you need to know the field name in
					the table you want to retrieve.
				</p>
			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Selecting Fields"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
