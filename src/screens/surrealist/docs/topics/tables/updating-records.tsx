import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview, TableTitle } from "~/screens/surrealist/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/docs/types";
import { useDocsTable } from "../../hooks/table";

export function DocsTablesUpdatingRecords({ language }: TopicProps) {
	const table = useDocsTable();

	const fieldName =
		table.fields.find(({ name }: { name: string }) => !["id", "in", "out"].includes(name))
			?.name ?? "id";

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
		UPDATE ${table.schema.name}:demo
		`,
			js: `
		// Update all records in a table
		await db.update('${table.schema.name}');

		// Update a record with a specific ID
		const [person] = await db.update('${table.schema.name}:${fieldName}', {
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
			db.update('${table.schema.name}', {name: "Jaime"})

			# Update a record with a specific ID
			db.update(RecordID('${table.schema.name}', 'tobie'), {
				"name": 'Tobie',
				"settings": {
					"active": True,
					"marketing": True,
				}
			})

		`,
			go: `
// Update a single record in the "persons" table
updatedPerson, err := surrealdb.Update[${table.schema.name}](db, models.RecordID("persons", "person123"), Person{
	Name:     "John",
	Surname:  "Smith", // Updated surname
	Location: models.NewGeometryPoint(-0.12, 23.00), // Updated location
})
		`,
			csharp: `
		await db.Upsert("${table.schema.name}", data);
		`,
			java: `
		// Connect to a local endpoint
		SurrealWebSocketConnection.connect(timeout)
		`,
			php: `
		$db->update("${table.schema.name}", [
			"name" => "Tobie",
			"settings" => [
				"active" => true,
				"marketing" => true
			]
		]);
		`,
		}),
		[table.schema.name, fieldName],
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
				<p>
					Update or modify all existing record in the table <b>{table.schema.name}</b> or
					specific records.
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
