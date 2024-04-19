import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useSchema } from "~/hooks/schema";
import { useActiveConnection } from "~/hooks/connection";

export function DocsTablesUpdatingRecords({ language, topic }: TopicProps) {
	const schema = useSchema();
	const fieldName = topic.extra?.table?.fields.find(({ name }: { name: string }) => !['id', 'in', 'out'].includes(name))?.name ?? 'id';
	const { connection } = useActiveConnection();

	const snippets = useMemo<Snippets>(() => ({
		cli: `
		${connection.namespace}/${connection.database}> UPDATE ${topic.extra?.table?.schema?.name}:DEMO
		`,
		js: `
		// Update all records in a table
		await db.update('${topic.extra?.table?.schema?.name}');

		// Update a record with a specific ID
		const [person] = await db.update('${topic.extra?.table?.schema?.name}: ${fieldName}', {
			name: 'Tobie',
			settings: {
				active: true,
				marketing: true,
			},
		});

		`,
		rust: `
		db.update("${topic.extra?.table?.schema?.name}").await?;
		`,
		py: `
		# Update all records in a table
		db.update("${topic.extra?.table?.schema?.name}");

		# Update a record with a specific ID
		person = await db.update('${topic.extra?.table?.schema?.name}: ${fieldName}', {
			'name': 'Jill'
		})

		`,
		go: `
		db.Update("${topic.extra?.table?.schema?.name}", map[string]interface{}{
			"name": "ElecTwix",
			"settings": map[string]bool{
				"active": true,
				"marketing": true,
			},
		});
		`,
		dotnet: `
		await db.Upsert(${topic.extra?.table?.schema?.name});
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
		<Article title="Updating Records">
			<div>
				<h3>Table: {topic.extra?.table?.schema?.name} </h3>
				<p>
					Update or modify all existing record in the table <b>{topic.extra?.table?.schema?.name}</b> or specific records.
				</p>
			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Updating Records"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
