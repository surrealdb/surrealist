import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useSchema } from "~/hooks/schema";
import { useActiveConnection } from "~/hooks/connection";

export function DocsTablesSelect({ language, topic }: TopicProps) {

	const fieldName = topic.extra?.table?.fields.find(({ name }: { name: string }) => !['id', 'in', 'out'].includes(name))?.name ?? 'record:id';

	const schema = useSchema();
	const { connection } = useActiveConnection();
	const snippets = useMemo<Snippets>(() => ({
		cli: `
		${connection.namespace}/${connection.database}> $ Select ${fieldName} from ${topic.extra?.table?.schema?.name}
		`,
		js: `
		// Select a specific record from a table
			const [person] = await db.select('${fieldName}');
		`,
		rust: `

		`,
		py: `

		`,
		go: `

		`,
		dotnet: `

		`,
		java:`
		driver.select("${fieldName}", rowType)
		`,
		php: `
		// Connect to a local endpoint
		$db = new SurrealDB();
		`,

	}), []);

	return (
		<Article title="Selecting Fields">
			<div>
				<h2>Table: {topic.extra?.table?.schema?.name} </h2>
				<p>
					Selecting fields operation is useful when you want to retrieve specific fields in a table without retrieving all the fields. To do this, you need to know the field name in the table you want to retrieve.
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
