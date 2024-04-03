import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useActiveConnection } from "~/hooks/connection";

export function DocsGlobalDatabases({ language, topic }: TopicProps) {

	const { connection } = useActiveConnection();
	const esc_database = JSON.stringify(connection.database);

	const snippets = useMemo<Snippets>(() => ({
		cli: `
			${connection.namespace}/${connection.database}> USE DB ${connection.database};
		`,
		js: `
			await db.use({
				database: ${esc_database}
			});
		`,
		rust: `
			db.use_db(${esc_database}).await?;
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
		<Article title="Databases">
			<div>
				<p>
					Define the namespace to use for the connection.
				</p>
				<p>
					{topic.extra?.table?.schema?.name}
				</p>
			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Define the database to use for the connection"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
