import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useSchema } from "~/hooks/schema";
import { useActiveConnection } from "~/hooks/connection";

export function DocsSchemaParams({ language, topic }: TopicProps) {
	const schema = useSchema();
	const { connection } = useActiveConnection();

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
		// Assign the variable on the connection
		DEFINE PARAM $endpointBase VALUE "https://dummyjson.com";

		// Remove a parameter from the connection
		REMOVE PARAM $endpointBase;

		`,
			js: `
			// Assign the variable on the connection
			await db.let('name', {
				first: 'Tobie',
				last: 'Morgan Hitchcock',
			});

			// Use the variable in a subsequent query
			await db.query('CREATE person SET name = $name');

			// Use the variable in a subsequent query
			await db.query('SELECT * FROM person WHERE name.first = $name.first');

			// Remove a parameter from the connection
			async db.unset(name);

		`,
			rust: `
		// Assign the variable on the connection
		db.set("name", Name {
			first: "Tobie",
			last: "Morgan Hitchcock",
		}).await?;


		// Use the variable in a subsequent query
		db.query("CREATE person SET name = $name").await?;


		// Use the variable in a subsequent query
		db.query("SELECT * FROM person WHERE name.first = $name.first").await?;
		`,
			py: `
		# Assign the variable on the connection
		await db.let("name", {
			"first": "Tobie",
			"last": "Morgan Hitchcock",
		})

		# Use the variable in a subsequent query
		await db.query('CREATE person SET name = $name')

		# Use the variable in a subsequent query
		await db.query('SELECT * FROM person WHERE name.first = $name.first')
		`,
			go: `
		// Assign the variable on the connection

		db.Let("name", map[string]string{
			"first": "ElecTwix",
			"last": "Morgan Hitchcock",
		});

		// Use the variable in a subsequent query
		db.Query("CREATE person SET name = $name", nil);

		// Use the variable in a subsequent query
		db.Query("SELECT * FROM person WHERE name.first = $name.first", nil);
		`,
			csharp: `
		// Assign the variable on the connection
		await db.Set("name", new { FirstName = "Tobie", LastName = "Morgan Hitchcock" });

		// Use the variable in a subsequent query
		await db.Query($"CREATE person SET name = $name");

		// Use the variable in a subsequent query
		await db.Query($"SELECT * FROM person WHERE name.first_name = $name.first_name");
		`,
			java: `
		driver.let(key, value)
		`,
			php: `
		// Connect to a local endpoint
		$db = new SurrealDB();
		`,
		}),
		[]
	);

	return (
		<Article title="Params">
			<div>
				<p>
					In your database you can define parameters that can be used
					in your queries. These parameters can be used to store
					values that are used in multiple queries, or to store values
					that are used in other parts of your application.
				</p>

			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Params"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
