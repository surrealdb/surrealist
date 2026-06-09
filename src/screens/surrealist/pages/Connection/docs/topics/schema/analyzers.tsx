import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Link } from "~/components/Link";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsSchemaAnalyzers({ language }: TopicProps) {
	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
-- Define an analyzer for full-text search tokenisation
DEFINE ANALYZER english
	TOKENIZERS blank, class, camel, punct
	FILTERS snowball(english);

-- Create a full-text index
DEFINE INDEX article_title ON article FIELDS title FULLTEXT ANALYZER english BM25;
`,
			js: `
await db.query(\`
	DEFINE ANALYZER english
		TOKENIZERS blank, class, camel, punct
		FILTERS snowball(english);

	DEFINE INDEX article_title ON article
		FIELDS title FULLTEXT ANALYZER english BM25;
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
`,
			py: `
await db.query("""
	DEFINE ANALYZER english
		TOKENIZERS blank, class, camel, punct
		FILTERS snowball(english);

	DEFINE INDEX article_title ON article
		FIELDS title FULLTEXT ANALYZER english BM25;
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
`,
			csharp: `
await db.RawQuery("""
	DEFINE ANALYZER english
		TOKENIZERS blank, class, camel, punct
		FILTERS snowball(english);

	DEFINE INDEX article_title ON article
		FIELDS title FULLTEXT ANALYZER english BM25;
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
`,
			php: `
$db->query('
	DEFINE ANALYZER english
		TOKENIZERS blank, class, camel, punct
		FILTERS snowball(english);

	DEFINE INDEX article_title ON article
		FIELDS title FULLTEXT ANALYZER english BM25;
');
`,
		}),
		[],
	);

	return (
		<Article title="Analyzers">
			<Box>
				<Box component="p">
					Analyzers configure how text is tokenised and filtered for full-text search.
					Combine them with <code>FULLTEXT ANALYZER</code> indexes. See the{" "}
					<Link href="https://surrealdb.com/docs/learn/data-models/full-text-search">
						full-text search guide
					</Link>{" "}
					for more.
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Define an analyzer"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
