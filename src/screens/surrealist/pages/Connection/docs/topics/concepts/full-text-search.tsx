import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Link } from "~/components/Link";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsConceptsFullTextSearch({ language }: TopicProps) {
	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
-- Define an analyzer
DEFINE ANALYZER english
	TOKENIZERS blank, class, camel, punct
	FILTERS snowball(english);

-- Create a full-text index
DEFINE INDEX article_title ON article
	FIELDS title FULLTEXT ANALYZER english BM25;

-- Search with the search::score function
SELECT title, search::score(1) AS score
FROM article
WHERE title @1@ 'database'
ORDER BY score DESC;
`,
			js: `
await db.query(\`
	DEFINE ANALYZER english
		TOKENIZERS blank, class, camel, punct
		FILTERS snowball(english);

	DEFINE INDEX article_title ON article
		FIELDS title FULLTEXT ANALYZER english BM25;
\`);

const results = await db.query(\`
	SELECT title, search::score(1) AS score
	FROM article
	WHERE title @1@ 'database'
	ORDER BY score DESC
\`);
`,
			rust: `
db.query(r#"
	DEFINE ANALYZER english
		TOKENIZERS blank, class, camel, punct
		FILTERS snowball(english);

	DEFINE INDEX article_title ON article
		FIELDS title FULLTEXT ANALYZER english BM25;
"#).await?;

let results: Vec<Article> = db
	.query(r#"
		SELECT title, search::score(1) AS score
		FROM article
		WHERE title @1@ 'database'
		ORDER BY score DESC
	"#)
	.await?
	.take(0)?;
`,
			py: `
await db.query("""
	DEFINE ANALYZER english
		TOKENIZERS blank, class, camel, punct
		FILTERS snowball(english);

	DEFINE INDEX article_title ON article
		FIELDS title FULLTEXT ANALYZER english BM25;
""")

results = await db.query("""
	SELECT title, search::score(1) AS score
	FROM article
	WHERE title @1@ 'database'
	ORDER BY score DESC
""")
`,
			go: `
_, err := surrealdb.Query[any](ctx, db, \`
	DEFINE ANALYZER english
		TOKENIZERS blank, class, camel, punct
		FILTERS snowball(english);

	DEFINE INDEX article_title ON article
		FIELDS title FULLTEXT ANALYZER english BM25;
\`, nil)

results, err := surrealdb.Query[[]Article](ctx, db, \`
	SELECT title, search::score(1) AS score
	FROM article
	WHERE title @1@ 'database'
	ORDER BY score DESC
\`, nil)
`,
			csharp: `
await db.RawQuery("""
	DEFINE ANALYZER english
		TOKENIZERS blank, class, camel, punct
		FILTERS snowball(english);

	DEFINE INDEX article_title ON article
		FIELDS title FULLTEXT ANALYZER english BM25;
""");

var results = await db.RawQuery("""
	SELECT title, search::score(1) AS score
	FROM article
	WHERE title @1@ 'database'
	ORDER BY score DESC
""");
`,
			java: `
db.query("""
	DEFINE ANALYZER english
		TOKENIZERS blank, class, camel, punct
		FILTERS snowball(english);

	DEFINE INDEX article_title ON article
		FIELDS title FULLTEXT ANALYZER english BM25;
""");

List<Article> results = db.query("""
	SELECT title, search::score(1) AS score
	FROM article
	WHERE title @1@ 'database'
	ORDER BY score DESC
""").take(Article.class, 0);
`,
			php: `
$db->query('
	DEFINE ANALYZER english
		TOKENIZERS blank, class, camel, punct
		FILTERS snowball(english);

	DEFINE INDEX article_title ON article
		FIELDS title FULLTEXT ANALYZER english BM25;
');

$results = $db->query('
	SELECT title, search::score(1) AS score
	FROM article
	WHERE title @1@ "database"
	ORDER BY score DESC
');
`,
		}),
		[],
	);

	return (
		<Article title="Full-text search">
			<Box>
				<Box component="p">
					Full-text search is ACID-compliant. Define an analyzer, create a{" "}
					<code>FULLTEXT ANALYZER</code> index, then query with the <code>@n@</code>{" "}
					operator and <code>search::score()</code>.{" "}
					<Link href="https://surrealdb.com/docs/learn/data-models/full-text-search/overview">
						Learn more
					</Link>
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Full-text search"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
