import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview, TableTitle } from "~/screens/surrealist/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/docs/types";
import { useDocsTable } from "../../hooks/table";

export function DocsTablesSelect({ language }: TopicProps) {
	const table = useDocsTable();

	const fieldName =
		table.fields.find(({ name }: { name: string }) => !["id", "in", "out"].includes(name))
			?.name ?? "id";

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
		SELECT ${fieldName} FROM ${table.schema.name}
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
		db.Select[[]${table.schema.name}, models.Table](db, models.Table("${fieldName}"))
		`,
			csharp: `
		await db.Select<Person>(new StringRecordId("person:h5wxrf2ewk8xjxosxtyc"));
		`,
			java: `
		driver.select("${fieldName}", rowType)
		`,
			php: `
		$record = new \\Surreal\\Cbor\\Types\\StringRecordId("${fieldName}");
		$db->select($record);
		`,
		}),
		[fieldName, table],
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
					Selecting fields operation is useful when you want to retrieve specific fields
					in a table without retrieving all the fields. To do this, you need to know the
					field name in the table you want to retrieve.
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
