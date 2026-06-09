import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsDataModelsDocument({ language }: TopicProps) {
	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
-- Schemafull table with nested objects and arrays
DEFINE TABLE person SCHEMAFULL;
CREATE person SET
	name = "Tobie",
	tags = ["developer", "rust"],
	metadata = { city: "London", country: "UK" };

-- Select nested fields
SELECT name, metadata.{ city, country } FROM person;
`,
			js: `
await db.create('person').content({
	name: 'Tobie',
	tags: ['developer', 'rust'],
	metadata: { city: 'London', country: 'UK' },
});

const people = await db.query(
	'SELECT name, metadata.{ city, country } FROM person',
);
`,
			rust: `
db.create("person")
	.content(json!({
		"name": "Tobie",
		"tags": ["developer", "rust"],
		"metadata": { "city": "London", "country": "UK" }
	}))
	.await?;
`,
			py: `
await db.create("person", {
	"name": "Tobie",
	"tags": ["developer", "rust"],
	"metadata": {"city": "London", "country": "UK"},
})
`,
			go: `
surrealdb.Create[Person](ctx, db, models.Table("person"), map[string]any{
	"name": "Tobie",
	"tags": []string{"developer", "rust"},
	"metadata": map[string]any{"city": "London", "country": "UK"},
})
`,
			java: `
db.create(Person.class, "person", person);
`,
			csharp: `
await db.Create("person", new {
	name = "Tobie",
	tags = new[] { "developer", "rust" },
	metadata = new { city = "London", country = "UK" },
});
`,
			php: `
$db->create("person", [
	"name" => "Tobie",
	"tags" => ["developer", "rust"],
	"metadata" => ["city" => "London", "country" => "UK"],
]);
`,
		}),
		[],
	);

	return (
		<Article title="Document model">
			<Box>
				<Box component="p">
					SurrealDB&apos;s document model stores JSON-like records with nested objects,
					arrays, and flexible field types. Use schemafull tables for enforced shapes, or
					schemaless tables for dynamic documents.
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Document model"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
