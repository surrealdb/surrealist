import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsSchemaParams({ language }: TopicProps) {
	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
-- Define a persistent parameter in the schema
DEFINE PARAM $endpointBase VALUE "https://api.example.com";

-- Assign a session parameter
LET $name = { first: "Tobie", last: "Morgan Hitchcock" };

-- Remove a schema parameter
REMOVE PARAM $endpointBase;
`,
			js: `
// Assign a session variable on the connection
await db.let('name', {
	first: 'Tobie',
	last: 'Morgan Hitchcock',
});

// Use the variable in a subsequent query
await db.query('CREATE person SET name = $name');

// Remove a session variable
await db.unset('name');
`,
			rust: `
db.set("name", Name {
	first: "Tobie".into(),
	last: "Morgan Hitchcock".into(),
}).await?;

db.query("CREATE person SET name = $name").await?;
db.unset("name").await?;
`,
			py: `
await db.let('name', {
	"first": "Tobie",
	"last": "Morgan Hitchcock",
})

await db.query('CREATE person SET name = $name')
await db.unset('name')
`,
			go: `
db.Let("name", map[string]any{
	"first": "Tobie",
	"last":  "Morgan Hitchcock",
})

surrealdb.Query[any](ctx, db, "CREATE person SET name = $name", nil)
db.Unset("name")
`,
			csharp: `
await db.Set("name", new { First = "Tobie", Last = "Morgan Hitchcock" });
await db.Query("CREATE person SET name = $name");
await db.Unset("name");
`,
			java: `
// Assign a session parameter via SurrealQL
db.query("""
	LET $name = { first: "Tobie", last: "Morgan Hitchcock" };
	CREATE person SET name = $name;
""");
`,
			php: `
$db->let("name", [
	"first" => "Tobie",
	"last" => "Morgan Hitchcock",
]);

$db->query('CREATE person SET name = $name');
$db->unset("name");
`,
		}),
		[],
	);

	return (
		<Article title="Parameters">
			<Box>
				<Box component="p">
					Parameters store reusable values in queries. Schema parameters persist in the
					database via <code>DEFINE PARAM</code>, while session parameters are set per
					connection with <code>LET $variable =</code>.
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Parameters"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
