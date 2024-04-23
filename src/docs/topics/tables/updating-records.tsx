import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview, TableTitle } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useActiveConnection } from "~/hooks/connection";
import { getTable } from "~/docs/helpers";

export function DocsTablesUpdatingRecords({ language, topic }: TopicProps) {
	const table = getTable(topic);
	const fieldName =
		table.fields.find(
			({ name }: { name: string }) => !["id", "in", "out"].includes(name)
		)?.name ?? "id";
	const { connection } = useActiveConnection();

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
		UPDATE ${table.schema.name}:demo
		`,
			js: `
		// Update all records in a table
		await db.update('${table.schema.name}');

		// Update a record with a specific ID
		const [person] = await db.update('${table.schema.name}: ${fieldName}', {
			name: 'Tobie',
			settings: {
				active: true,
				marketing: true,
			},
		});

		`,
			rust: `
		db.update("${table.schema.name}").await?;
		`,
			py: `
		# Update all records in a table
		db.update("${table.schema.name}");

		# Update a record with a specific ID
		person = await db.update('${table.schema.name}: ${fieldName}', {
			'name': 'Jill'
		})

		`,
			go: `
		db.Update("${table.schema.name}", map[string]interface{}{
			"name": "ElecTwix",
			"settings": map[string]bool{
				"active": true,
				"marketing": true,
			},
		});
		`,
			csharp: `
		await db.Upsert(${table.schema.name});
		`,
			java: `
		// Connect to a local endpoint
		SurrealWebSocketConnection.connect(timeout)
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
					title="Updating records"
					table={table.schema.name}
				/>
			}
		>
			<div>
				<h3>Table: {table.schema.name} </h3>
				<p>
					Update or modify all existing record in the table{" "}
					<b>{table.schema.name}</b> or specific records.
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
