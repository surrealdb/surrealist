import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview, TableTitle } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useActiveConnection } from "~/hooks/connection";
import { getTable } from "~/docs/helpers";

export function DocsTablesSelect({ language, topic }: TopicProps) {
	const table = getTable(topic);
	const fieldName =
		table.fields.find(
			({ name }: { name: string }) => !["id", "in", "out"].includes(name)
		)?.name ?? "table:id";

	const { connection } = useActiveConnection();
	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
		SELECT ${fieldName} FROM ${topic.extra?.table?.schema?.name}
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
			csharp: `
		db.Select('${fieldName}')
		`,
			java: `
		driver.select("${fieldName}", rowType)
		`,
			php: `
		// Connect to a local endpoint
		$db = new SurrealDB();
		`,
		}),
		[]
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
