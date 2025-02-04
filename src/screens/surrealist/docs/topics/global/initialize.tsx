import { Box } from "@mantine/core";
import { useMemo } from "react";
import { useConnection } from "~/hooks/connection";
import { Article, DocsPreview } from "~/screens/surrealist/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/docs/types";
import { createBaseAuthentication } from "~/util/defaults";
import { connectionUri } from "~/util/helpers";

export function DocsGlobalInit({ language }: TopicProps) {
	const authentication = useConnection((c) => c?.authentication ?? createBaseAuthentication());
	const endpoint = connectionUri(authentication);
	const esc_endpoint = JSON.stringify(endpoint);
	const esc_namespace = JSON.stringify(authentication.namespace);
	const esc_database = JSON.stringify(authentication.database);

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
			surreal sql --endpoint ${esc_endpoint} --namespace ${esc_namespace} --database ${esc_database}
		`,
			js: `
			import Surreal from 'surrealdb';

			// Create a new Surreal instance
			const db = new Surreal();

			// Connect to the database
			await db.connect(${esc_endpoint}, {
				namespace: ${esc_namespace},
				database: ${esc_database}
			});
		`,
			rust: `
			use surrealdb::engine::any;

			// Connect to the database
			let db = any::connect(${esc_endpoint}).await?;

			// Specify namespace and database
			db.use_ns(${esc_namespace}).use_db(${esc_database}).await?;
		`,
			py: `
			# Connect to a local endpoint with http protocol
			db = Surreal('http://127.0.0.1:8000')

			# Connect to a remote endpoint with ws protocol
			db = AsyncSurreal('wss://cloud.surrealdb.com')
		`,
			go: `
		// Connect to a local endpoint
		surrealdb.New("ws://localhost:8000/rpc");
		// Connect to a remote endpoint
		surrealdb.New("wss://cloud.surrealdb.com/rpc");
		`,
			csharp: `
			// Connect to a local endpoint
		var db = new SurrealDbClient("http://127.0.0.1:8000");

		// Connect to a remote endpoint
		var db = new SurrealDbClient("wss://cloud.surrealdb.com/rpc");
		`,
			java: `
		// Connect to a local endpoint
		SurrealWebSocketConnection.connect(timeout)
		`,
			php: `
		$db = new \\Surreal\\Surreal();
		`,
		}),
		[esc_endpoint, esc_namespace, esc_database],
	);

	return (
		<Article title="Initialising">
			<div>
				<p>
					To initialise a connection to SurrealDB, you need to create a new instance of a
					SurrealDB client and connect. This will allow you to interact with the database
					and run queries to the database. Do this by importing the Surreal class and
					create a new instance of the class. Then, use the connect method to connect to
					the database.
				</p>
			</div>
			<Box>
				<DocsPreview
					language={language}
					title="initialise"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
