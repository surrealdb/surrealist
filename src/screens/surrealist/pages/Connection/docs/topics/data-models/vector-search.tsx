import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsDataModelsVectorSearch({ language }: TopicProps) {
	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
-- Define an HNSW vector index
DEFINE INDEX embedding_idx ON article
	FIELDS embedding HNSW DIMENSION 384 DIST COSINE TYPE F32;

-- KNN similarity search
LET $query = [0.1, 0.2, 0.3, ...];
SELECT title, vector::similarity::cosine(embedding, $query) AS score
FROM article
WHERE embedding <|10,COSINE|> $query
ORDER BY score DESC;
`,
			js: `
await db.query(\`
	DEFINE INDEX embedding_idx ON article
		FIELDS embedding HNSW DIMENSION 384 DIST COSINE TYPE F32;
\`);

const results = await db.query(
	\`SELECT title, vector::similarity::cosine(embedding, $query) AS score
	 FROM article WHERE embedding <|10,COSINE|> $query ORDER BY score DESC\`,
	{ query: embeddingVector },
);
`,
			rust: `
db.query(r#"
	DEFINE INDEX embedding_idx ON article
		FIELDS embedding HNSW DIMENSION 384 DIST COSINE TYPE F32;
"#).await?;

let results = db
	.query("SELECT title FROM article WHERE embedding <|10,COSINE|> $query")
	.bind(("query", embedding_vector))
	.await?;
`,
			py: `
await db.query("""
	DEFINE INDEX embedding_idx ON article
		FIELDS embedding HNSW DIMENSION 384 DIST COSINE TYPE F32;
""")

results = await db.query(
	"SELECT title FROM article WHERE embedding <|10,COSINE|> $query",
	{"query": embedding_vector},
)
`,
			go: `
_, err := surrealdb.Query[any](ctx, db, \`
	DEFINE INDEX embedding_idx ON article
		FIELDS embedding HNSW DIMENSION 384 DIST COSINE TYPE F32;
\`, nil)
`,
			java: `
db.query("""
	DEFINE INDEX embedding_idx ON article
		FIELDS embedding HNSW DIMENSION 384 DIST COSINE TYPE F32;
""");
`,
			csharp: `
await db.RawQuery("""
	DEFINE INDEX embedding_idx ON article
		FIELDS embedding HNSW DIMENSION 384 DIST COSINE TYPE F32;
""");
`,
			php: `
$db->query('
	DEFINE INDEX embedding_idx ON article
		FIELDS embedding HNSW DIMENSION 384 DIST COSINE TYPE F32;
');
`,
		}),
		[],
	);

	return (
		<Article title="Vector search">
			<Box>
				<Box component="p">
					Store embedding vectors and query them with <code>HNSW</code> indexes and KNN
					operators. Combine vector similarity with relational and graph queries in a
					single statement.
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Vector search"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
