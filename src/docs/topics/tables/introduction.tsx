import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useSchema } from "~/hooks/schema";
import { useActiveConnection } from "~/hooks/connection";

export function DocsTablesIntroduction({ language, topic }: TopicProps) {

	const schema = useSchema();
	const { connection } = useActiveConnection();

	const snippets = useMemo<Snippets>(() => ({
		cli: `
		${connection.namespace}/${connection.database}>
		-- Create schemafull user table.
		DEFINE TABLE user SCHEMAFULL;
		`,
		js: `
		db.create('${topic.extra?.table?.schema?.name}');
		`,
		rust: `
		db.create("${topic.extra?.table?.schema?.name}").await?;
		`,
		py: `
		db.create('${topic.extra?.table?.schema?.name}')
		`,
		go: `
		db.Create("${topic.extra?.table?.schema?.name}", map[string]interface{}{})
		`,
		dotnet: `
		db.Create<${topic.extra?.table?.schema?.name}>("${topic.extra?.table?.schema?.name}");
		`,
		java:`
		// Connect to a local endpoint
		SurrealWebSocketConnection.connect(timeout)
		`,
		php: `
		// Connect to a local endpoint
		$db = new SurrealDB();
		`,

	}), []);

	return (
		<Article title="Tables">
			<div>
				<p>
					All the tables available in your database are listed in this section. You can view the schema of each table, the columns, and the data types of each column.
				</p>
				<p>
					{topic.extra?.table?.schema?.name}
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
