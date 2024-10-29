import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/database/docs/components";
import type { Snippets, TopicProps } from "~/screens/database/docs/types";

export function DocsSchemaParams({ language }: TopicProps) {
	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
		// Assign a variable on the connection
		DEFINE PARAM $endpointBase VALUE "https://dummyjson.com";

		// Remove a parameter from the connection
		REMOVE PARAM $endpointBase;

		`,
			js: `
			// Assign a variable on the connection
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
		// Assign a variable on the connection
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
		# Assign a variable on the connection
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
		// Assign a variable on the connection

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
		// Assign a variable on the connection
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
		$db->let("name", [
			"firstname" => "Tobie",
			"lastname" => "Morgan Hitchcock"
		]);

		$db->query('SELECT * FROM person WHERE name.firstname = $name.firstname');
		`,
		}),
		[],
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
