import { Anchor, Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/database/docs/components";
import type { Snippets, TopicProps } from "~/screens/database/docs/types";

export function DocsSchemaAnalyzers({ language }: TopicProps) {
	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
		DEFINE ANALYZER example_ngram TOKENIZERS class FILTERS ngram(1,3);
		`,
			js: `
		import { Surreal } from 'surrealdb';

		const db = new Surreal();

		import { Surreal } from 'surrealdb';
		const db = new Surreal();
		await db.connect('<the actual address of the connection>/rpc', {
			namespace: '<the actual ns of the connection>',
			database: '<the action db of the connection>'
		});

		`,
			rust: `
		//Connect to a local endpoint
		DB.connect::<Ws>("127.0.0.1:8000").await?;
		//Connect to a remote endpoint
		DB.connect::<Wss>("cloud.surrealdb.com").await?;
		`,
			py: `
		# Connect to a local endpoint
		db = Surreal()
		await db.connect('http://127.0.0.1:8000/rpc')
		# Connect to a remote endpoint
		db = Surreal()
		await db.connect('https://cloud.surrealdb.com/rpc')
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
				DEFINE ANALYZER example_ngram TOKENIZERS class FILTERS ngram(1,3);
			"""
		);
		`,
			java: `
		// Connect to a local endpoint
		SurrealWebSocketConnection.connect(timeout)
		`,
			php: `
		$db->query("DEFINE ANALYZER example_ngram TOKENIZERS class FILTERS ngram(1,3)");
		`,
		}),
		[],
	);

	return (
		<Article title="Analyzers">
			<div>
				<p>
					Analyzers are used to enable full-text search on a table
					within your database. If you have any analzers defined for a
					table, you can use the full-text search capabilities of
					SurrealDB. Checkout the section on{" "}
					<Anchor href="https://surrealdb.com/docs/surrealdb/reference-guide/full-text-search">
						{" "}
						Full Text Search for more information.
					</Anchor>
				</p>
			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Analyzers"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
