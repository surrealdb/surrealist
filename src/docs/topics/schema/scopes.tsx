import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useSchema } from "~/hooks/schema";
import { useActiveConnection } from "~/hooks/connection";

export function DocsSchemaScopes({ language, topic }: TopicProps) {
	const schema = useSchema();
	const { connection } = useActiveConnection();

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
		-- Enable scope authentication directly in SurrealDB
		DEFINE SCOPE account SESSION 24h
		SIGNUP (
			CREATE user SET email = $email, pass = crypto::argon2::generate($pass)
		)
		SIGNIN (
			SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(pass, $pass)
		);
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
			csharp: `
		await this.RawQuery(
			"""
				-- Enable scope authentication directly in SurrealDB
				DEFINE SCOPE account SESSION 24h
				SIGNUP (
					CREATE user SET email = $email, pass = crypto::argon2::generate($pass)
				)
				SIGNIN (
					SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(pass, $pass)
				);
			"""
		);
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
		<Article title="Scopes">
			<div>
				<p>
					Within SurrealDB, scopes are a way to manage access to data.
					They are defined within the schema and can be used to
					restrict access to certain parts of the data. To access data
					within a scope, you must first sign in with the appropriate
					credentials. In SDKs you can run qu
				</p>

			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Scopes"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
