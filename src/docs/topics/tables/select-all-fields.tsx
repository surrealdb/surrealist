import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useSchema } from "~/hooks/schema";
import { useActiveConnection } from "~/hooks/connection";

export function DocsTablesSelectAllFields({ language, topic }: TopicProps) {

	const schema = useSchema();
	const { connection } = useActiveConnection();

	const snippets = useMemo<Snippets>(() => ({
		cli: `
		${connection.namespace}/${connection.database}> Select * from ${topic.extra?.table?.schema?.name}
		`,
		js: `
		db.select('${topic.extra?.table?.schema?.name}');
		`,
		rust: `
		let people: Vec<Person> = db.select("${topic.extra?.table?.schema?.name}").await?;
		`,
		py: `
		db.select('${topic.extra?.table?.schema?.name}');
		`,
		go: `
		db.Select('${topic.extra?.table?.schema?.name}');
		`,
		dotnet: `
		db.Select('${topic.extra?.table?.schema?.name}');
		`,
		java:`
		driver.select("thing", rowType)
		`,
		php: `
		// Connect to a local endpoint
		$db = new SurrealDB();
		`,

	}), []);

	return (
		<Article title="Selecting all fields">
			<div>
				<h2>Table: {topic.extra?.table?.schema?.name} </h2>
				<p>
					Selecting all fields in a table is a common operation when you want to retrieve all the fields in a table. This operation is useful when you want to retrieve all the fields in a table without specifying the fields explicitly.
				</p>
			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Selecting all fields"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
