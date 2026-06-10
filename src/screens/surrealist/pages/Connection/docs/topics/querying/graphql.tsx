import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsQueryingGraphql({ language }: TopicProps) {
	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
-- Enable the GraphQL API for the current database
DEFINE CONFIG GRAPHQL AUTO;

-- Query via HTTP POST to /graphql
-- Headers: Surreal-NS, Surreal-DB, Authorization
`,
			js: `
// Enable GraphQL on the database
await db.query('DEFINE CONFIG GRAPHQL AUTO');

// Query via HTTP (not SDK-native)
const response = await fetch('http://localhost:8000/graphql', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'Surreal-NS': 'main',
		'Surreal-DB': 'main',
		'Authorization': 'Basic ' + btoa('root:secret'),
	},
	body: JSON.stringify({
		query: '{ people { id name } }',
	}),
});
`,
			rust: `
db.query("DEFINE CONFIG GRAPHQL AUTO").await?;
// Query via HTTP POST to /graphql with Surreal-NS and Surreal-DB headers
`,
			py: `
await db.query("DEFINE CONFIG GRAPHQL AUTO")
# Query via HTTP POST to /graphql
`,
			go: `
_, err := surrealdb.Query[any](ctx, db, "DEFINE CONFIG GRAPHQL AUTO", nil)
// Query via HTTP POST to /graphql
`,
			java: `
db.query("DEFINE CONFIG GRAPHQL AUTO");
// Query via HTTP POST to /graphql
`,
			csharp: `
await db.RawQuery("DEFINE CONFIG GRAPHQL AUTO");
// Query via HttpClient POST to /graphql
`,
			php: `
$db->query('DEFINE CONFIG GRAPHQL AUTO');
// Query via HTTP POST to /graphql
`,
		}),
		[],
	);

	return (
		<Article title="GraphQL API">
			<Box>
				<Box component="p">
					Enable a GraphQL endpoint per database with <code>DEFINE CONFIG GRAPHQL</code>.
					Clients query via HTTP POST to <code>/graphql</code> with{" "}
					<code>Surreal-NS</code> and <code>Surreal-DB</code> headers. Table and function
					exposure can be configured with AUTO, INCLUDE, or EXCLUDE.
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="GraphQL API"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
