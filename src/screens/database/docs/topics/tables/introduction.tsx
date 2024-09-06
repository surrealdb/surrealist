import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/database/docs/components";
import type { Snippets, TopicProps } from "~/screens/database/docs/types";

export function DocsTablesIntroduction({ language }: TopicProps) {
	const snippets = useMemo<Snippets>(
		() => ({
			cli: `

		-- Create schemafull user table.
		DEFINE TABLE table_name SCHEMAFULL;
		`,
			js: `
		db.create('table_name');
		`,
			rust: `
		db.create("table_name").await?;
		`,
			py: `
		db.create('table_name')
		`,
			go: `
		db.Create("table_name", map[string]interface{}{})
		`,
			csharp: `
		await db.Create<TableName>("table_name");
		`,
			java: `
		// Connect to a local endpoint
		SurrealWebSocketConnection.connect(timeout)
		`,
			php: `
		$db->create("table_name");
		`,
		}),
		[],
	);

	return (
		<Article title="Tables">
			<div>
				<p>
					All the tables available in your database are listed in this
					section. You can view the schema of each table, the columns,
					and the data types of each column.
				</p>
			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Tables"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
