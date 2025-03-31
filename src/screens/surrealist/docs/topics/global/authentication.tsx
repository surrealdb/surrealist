import { Box } from "@mantine/core";
import { useMemo } from "react";
import { useConnection } from "~/hooks/connection";
import { Article, DocsPreview } from "~/screens/surrealist/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/docs/types";
import { createBaseAuthentication } from "~/util/defaults";

export function DocsGlobalAuthentication({ language, topic }: TopicProps) {
	const auth = useConnection((c) => c?.authentication ?? createBaseAuthentication());
	const esc_namespace = JSON.stringify(auth.namespace);
	const esc_database = JSON.stringify(auth.database);

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
			surreal sql --endpoint ${topic.extra?.connectionUri} --namespace ${topic.extra?.namespace} --database ${topic.extra?.database}
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
			# update Surreal to AsyncSurreal if using async code
		from surrealdb import Surreal
# Without using a context manager
		db = Surreal('ws://localhost:8000')
        db.use('${esc_namespace}', '${esc_database}')
# Sign in and your code...
        db.close()	

# Using a context manager
with Surreal('ws://localhost:8000') as db:
    db.use('namespace', 'database')
	# Sign in and your code...
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
		await db.Connect();
		`,
			java: `
		// Connect to a local endpoint
		SurrealWebSocketConnection.connect(timeout)
		`,
			php: `
		// Connect to a local endpoint
		$db = new SurrealDB();
		`,
		}),
		[topic.extra, esc_namespace, esc_database],
	);

	return (
		<Article title="Authentication">
			<div>
				<p>
					Enabling authentication for your database is a critical step in securing your
					data. SurrealDB provides a simple way to enable authentication for your
					database.
				</p>
			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Enable authentication"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
