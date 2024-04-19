import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useSchema } from "~/hooks/schema";
import { useActiveConnection } from "~/hooks/connection";

export function DocsTablesDeletingRecords({ language, topic }: TopicProps) {

	const schema = useSchema();
	const { connection } = useActiveConnection();

	const snippets = useMemo<Snippets>(() => ({
		cli: `
		${connection.namespace}/${connection.database}> DELETE ${topic.extra?.table?.schema?.name}:DEMO
		`,
		js: `
		db.delete('${topic.extra?.table?.schema?.name}');
		`,
		rust: `
		db.delete("${topic.extra?.table?.schema?.name}").await?;
		`,
		py: `
		db.delete('${topic.extra?.table?.schema?.name}')
		`,
		go: `
		db.Delete("${topic.extra?.table?.schema?.name}", map[string]interface{}{})
		`,
		dotnet: `
		db.delete<${topic.extra?.table?.schema?.name}>("${topic.extra?.table?.schema?.name}");
		`,
		java:`
		driver.delete(thing, data)
		`,
		php: `
		// Connect to a local endpoint
		$db = new SurrealDB();
		`,

	}), []);

	return (
		<Article title="Deleting Records">
			<div>
				<h3>Table: {topic.extra?.table?.schema?.name} </h3>
				<p>
					Deleting records is a common operation when you want to remove records from a table. This operation is useful when you want to remove records from a table and can also be based on certain conditions using the Where clause.
				</p>
				<p>

				</p>
			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Deleting Records"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
