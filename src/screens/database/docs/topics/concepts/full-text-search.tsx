import { Anchor, Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/database/docs/components";
import { Snippets, TopicProps } from "~/screens/database/docs/types";

export function DocsConceptsFullTextSearch({ language }: TopicProps) {
	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
		DEFINE TABLE page SCHEMALESS PERMISSIONS FOR select FULL;
		DEFINE ANALYZER simple TOKENIZERS blank,class,camel,punct FILTERS snowball(english);
		DEFINE INDEX page_hostname ON page FIELDS hostname;
		DEFINE INDEX page_date_indexed ON page FIELDS date;
		DEFINE INDEX unique_page ON page FIELDS hostname, path UNIQUE;
		DEFINE INDEX page_title ON page FIELDS title SEARCH ANALYZER simple BM25(1.2,0.75);
		DEFINE INDEX page_path ON page FIELDS path SEARCH ANALYZER simple BM25(1.2,0.75);
		DEFINE INDEX page_h1 ON page FIELDS h1 SEARCH ANALYZER simple BM25(1.2,0.75);
		DEFINE INDEX page_h2 ON page FIELDS h2 SEARCH ANALYZER simple BM25(1.2,0.75);
		DEFINE INDEX page_h3 ON page FIELDS h3 SEARCH ANALYZER simple BM25(1.2,0.75);
		DEFINE INDEX page_h4 ON page FIELDS h4 SEARCH ANALYZER simple BM25(1.2,0.75);
		DEFINE INDEX page_content ON page FIELDS content SEARCH ANALYZER simple BM25(1.2,0.75) HIGHLIGHTS;
		DEFINE INDEX page_code ON page FIELDS code SEARCH ANALYZER simple BM25(1.2,0.75);
		`,
			js: `
		db.query('DEFINE TABLE page SCHEMALESS PERMISSIONS FOR select FULL;
		DEFINE ANALYZER simple TOKENIZERS blank,class,camel,punct FILTERS snowball(english);
		DEFINE INDEX page_hostname ON page FIELDS hostname;
		DEFINE INDEX page_date_indexed ON page FIELDS date;');
		`,
			rust: `
		db.query('DEFINE TABLE page SCHEMALESS PERMISSIONS FOR select FULL;
		DEFINE ANALYZER simple TOKENIZERS blank,class,camel,punct FILTERS snowball(english);
		DEFINE INDEX page_hostname ON page FIELDS hostname;
		DEFINE INDEX page_date_indexed ON page FIELDS date;');
		`,
			py: `
		db.query('DEFINE TABLE page SCHEMALESS PERMISSIONS FOR select FULL;
		DEFINE ANALYZER simple TOKENIZERS blank,class,camel,punct FILTERS snowball(english);
		DEFINE INDEX page_hostname ON page FIELDS hostname;
		DEFINE INDEX page_date_indexed ON page FIELDS date;');
		`,
			go: `
		// Connect to a local endpoint
		surrealdb.New("ws://localhost:8000/rpc");
		// Connect to a remote endpoint
		surrealdb.New("ws://cloud.surrealdb.com/rpc");
		`,
			csharp: `
		await db.RawQuery(
			"""
				DEFINE TABLE page SCHEMALESS PERMISSIONS FOR select FULL;

				DEFINE ANALYZER simple TOKENIZERS blank,class,camel,punct FILTERS snowball(english);
				DEFINE INDEX page_hostname ON page FIELDS hostname;
				DEFINE INDEX page_date_indexed ON page FIELDS date;
			"""
		);
		`,
			java: `
		// Connect to a local endpoint
		SurrealWebSocketConnection.connect(timeout)
		`,
			php: `
		$db->query('
			DEFINE TABLE page SCHEMALESS PERMISSIONS FOR select FULL;
			DEFINE ANALYZER simple TOKENIZERS blank,class,camel,punct FILTERS snowball(english);
			DEFINE INDEX page_hostname ON page FIELDS hostname;
			DEFINE INDEX page_date_indexed ON page FIELDS date;
		');
		`,
		}),
		[]
	);

	return (
		<Article title="Full Text Search">
			<div>
				<p>
					Full Text Search enables search capabilities within your
					database connection. This enables text matching, proximity
					matching, proximity search, and more. In SurrealDB Full-Text
					Search is ACID-COMPLIANT and you can access this using{" "}
					<Anchor href="https://surrealdb.com/docs/surrealdb/surrealql/functions/search#searchhighlight">
						{" "}
						Search functions
					</Anchor>
					,{" "}
					<Anchor href="https://surrealdb.com/docs/surrealdb/surrealql/statements/define/indexes/">
						{" "}
						Indexes
					</Anchor>
					. To learn more checkout this{" "}
					<Anchor href="https://surrealdb.com/docs/surrealdb/reference-guide/full-text-search">
						{" "}
						Reference guide
					</Anchor>
				</p>
			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Full Text Search"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
