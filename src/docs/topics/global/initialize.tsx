import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useActiveConnection } from "~/hooks/connection";
import { connectionUri } from "~/util/helpers";

export function DocsGlobalInit({ language, topic }: TopicProps) {
	const { connection } = useActiveConnection();
	const endpoint = connectionUri(connection);
	const esc_endpoint = JSON.stringify(endpoint);
	const esc_namespace = JSON.stringify(connection.namespace);
	const esc_database = JSON.stringify(connection.database);

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
			surreal sql --endpoint ${endpoint} --namespace ${connection.namespace} --database ${connection.database}
		`,
			js: `
			import { Surreal } from 'surrealdb.js';

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
		// Connect to a local endpoint
		$db = new SurrealDB();
		`,
		}),
		[]
	);

	return (
		<Article title="Initialises">
			<div>
				<p>
					To initialise a connection to SurrealDB, you need to create
					a new instance of the Surreal class and connect.This will
					allow you to interact with the database and run queries to
					the database. Do this by importing the Surreal class and
					create a new instance of the class. Then, use the connect
					method to connect to the database.
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
