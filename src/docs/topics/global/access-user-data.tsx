import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useActiveConnection } from "~/hooks/connection";

export function DocsGlobalAccessUserData({ language, topic }: TopicProps) {

	const { connection } = useActiveConnection();

	const snippets = useMemo<Snippets>(() => ({
		cli: `
			${connection.namespace}/${connection.database}> $auth;
		`,
		js: `
			await db.info();
		`,
		rust: `
			let mut result = db.query("$auth").await?;
			let info: Person = result.take(0)?;
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
		<Article title="Access user data">
			<div>
				<p>
					Signing up a new user
				</p>
				<p>
					{topic.extra?.table?.schema?.name}
				</p>
			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Access user data"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
