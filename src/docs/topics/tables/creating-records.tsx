import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useSchema } from "~/hooks/schema";
import { useActiveConnection } from "~/hooks/connection";

export function DocsTablesCreatingRecords({ language, topic }: TopicProps) {

	const schema = useSchema();
	const { connection } = useActiveConnection();

	const snippets = useMemo<Snippets>(() => ({
		cli: `
		${connection.namespace}/${connection.database}> CREATE ${topic.extra?.table?.schema?.name}:DEMO
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
		driver.create(thing, data)
		`,
		php: `
		// Connect to a local endpoint
		$db = new SurrealDB();
		`,

	}), []);

	return (
		<Article title="Creating Records">
			<div>
				<h3>Table: {topic.extra?.table?.schema?.name} </h3>
				<p>
					Add a new record to the table<b> {topic.extra?.table?.schema?.name} </b>. The record will have a random record ID if not specified after the table name. You can also specify the fields of the record.
				</p>
			</div>
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
