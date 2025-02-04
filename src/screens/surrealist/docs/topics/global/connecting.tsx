import { Box } from "@mantine/core";
import { useMemo } from "react";
import { useConnection } from "~/hooks/connection";
import { Article, DocsPreview } from "~/screens/surrealist/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/docs/types";
import { createBaseAuthentication } from "~/util/defaults";
import { connectionUri } from "~/util/helpers";

export function DocsGlobalConnecting({ language }: TopicProps) {
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
			await db.connect(${esc_endpoint}, {
				namespace: ${esc_namespace},
				database: ${esc_database}
			});
		`,
			rust: `
			let db = any::connect(${esc_endpoint}).await?;
			db.use_ns(${esc_namespace}).use_db(${esc_database}).await?;
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
				db.use('${esc_namespace}', '${esc_database}')
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
		$db->connect("http://localhost:8000", [
			"namespace" => "test",
			"database" => "test"
		]);
		`,
		}),
		[esc_endpoint, esc_namespace, esc_database],
	);

	return (
		<Article title="Connecting">
			<div>
				<p>
					The connection API is used to establish a connection to a SurrealDB instance.
					The connection is used to interact with the database and perform operations on
					the data. While connecting to the database, the user can specify the namespace
					and database to connect to, as well as the authentication details for the
					connection.
				</p>
			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Opening a connection"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
