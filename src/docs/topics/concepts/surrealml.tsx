import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useSchema } from "~/hooks/schema";

export function DocsConceptsSurrealML({ language, topic }: TopicProps) {

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
		<Article title="Surreal ML">
			<div>
				<p>
				SurrealML is an engine that seeks to do one thing, and one thing well: store and execute trained ML models. SurrealML does not intrude on the training frameworks that are already out there, instead works with them to ease the storage, loading, and execution of models. Someone using SurrealML will be able to train their model in a chosen framework in Python, save their model, and load and execute the model in either Python or Rust.

				You can use SurrealML within your database connection to store and execute trained ML models using <a href="https://surrealdb.com/docs/surrealdb/surrealql/functions/ml">Machine learning functions</a>.


				Learn more about <a href="https://surrealdb.com/docs/surrealdb/surrealml">SurrealML in the documentation</a>


				</p>
				<p>
					{topic.extra?.table?.schema?.name}
				</p>
			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Surreal ML"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
