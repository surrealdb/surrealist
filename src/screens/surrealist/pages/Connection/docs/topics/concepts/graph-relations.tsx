import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsConceptsGraphRelations({ language }: TopicProps) {
	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
-- Create records
CREATE user:alice SET name = "Alice";
CREATE post:hello SET title = "Hello world";

-- Create a graph edge with RELATE
RELATE user:alice->wrote->post:hello SET
	published_at = time::now();

-- Query the edge and its properties
SELECT * FROM wrote WHERE in = user:alice;

-- Delete a relationship
DELETE wrote WHERE in = user:alice AND out = post:hello;
`,
			js: `
// Create a graph relationship with SurrealQL
await db.query(\`
	RELATE user:alice->wrote->post:hello SET
		published_at = time::now();
\`);

// Query edges
const edges = await db.query('SELECT * FROM wrote WHERE in = user:alice');
`,
			rust: `
db.query(r#"
	RELATE user:alice->wrote->post:hello SET
		published_at = time::now();
"#).await?;

let edges: Vec<Edge> = db
	.query("SELECT * FROM wrote WHERE in = user:alice")
	.await?
	.take(0)?;
`,
			py: `
await db.query("""
	RELATE user:alice->wrote->post:hello SET
		published_at = time::now();
""")

edges = await db.query("SELECT * FROM wrote WHERE in = user:alice")
`,
			go: `
_, err := surrealdb.Query[any](ctx, db, \`
	RELATE user:alice->wrote->post:hello SET
		published_at = time::now();
\`, nil)

edges, err := surrealdb.Query[[]Edge](ctx, db,
	"SELECT * FROM wrote WHERE in = user:alice", nil,
)
`,
			csharp: `
await db.RawQuery("""
	RELATE user:alice->wrote->post:hello SET
		published_at = time::now();
""");

var edges = await db.RawQuery("SELECT * FROM wrote WHERE in = user:alice");
`,
			java: `
import com.surrealdb.RecordId;

db.relate(
	new RecordId("user", "alice"),
	"wrote",
	new RecordId("post", "hello"),
	Map.of("published_at", Instant.now())
);

List<Edge> edges = db.query(
	"SELECT * FROM wrote WHERE in = user:alice"
).take(Edge.class, 0);
`,
			php: `
$db->query('
	RELATE user:alice->wrote->post:hello SET
		published_at = time::now();
');

$edges = $db->query("SELECT * FROM wrote WHERE in = user:alice");
`,
		}),
		[],
	);

	return (
		<Article title="Graph relations">
			<Box>
				<Box component="p">
					Use <code>RELATE</code> to create edges between records. Edge tables store
					relationship metadata and can be queried independently. Record links offer a
					lighter alternative when you only need a reference field without edge
					properties.
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Create graph relations"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
