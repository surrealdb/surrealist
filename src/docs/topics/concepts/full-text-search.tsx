import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useSchema } from "~/hooks/schema";

export function DocsConceptsFullTextSearch({ language, topic }: TopicProps) {

	const schema = useSchema();

	const snippets = useMemo<Snippets>(() => ({
		cli: `
			$ surreal sql --endpoint ${topic.extra?.connectionUri} --namespace ${topic.extra?.namespace} --database ${topic.extra?.database}
		`,
		js: `
		import { Surreal } from 'surrealdb.js';

		const db = new Surreal();

		import { Surreal } from 'surrealdb.js';
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
		dotnet: `
		await db.Connect();
		`,
		java:`
		// Connect to a local endpoint
		SurrealWebSocketConnection.connect(timeout)
		`,
		php: `
		// Connect to a local endpoint
		$db = new SurrealDB();
		`,

	}), []);

	return (
		<Article title="Full Text Search">
			<div>
				<p>
					Full Text Search enables search capabilities within your database connection.
					This enables text matching, proximity matching, proximity search, and more. In SurrealDB Full-Text Search is ACID-COMPLIANT and you can access this using <a href="https://surrealdb.com/docs/surrealdb/surrealql/functions/search#searchhighlight"> Search funnctions</a>, <a href="https://surrealdb.com/docs/surrealdb/surrealql/statements/define/indexes/"> Indexes</a>. To learn more checkout this <a href="https://surrealdb.com/docs/surrealdb/reference-guide/full-text-search"> Reference guide</a>
				</p>
				<p>
					{topic.extra?.table?.schema?.name}
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
