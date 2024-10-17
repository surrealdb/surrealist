import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/database/docs/components";
import type { Snippets, TopicProps } from "~/screens/database/docs/types";

export function DocsSchemaScopes({ language }: TopicProps) {
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
		$db->query('
			-- Enable scope authentication directly in SurrealDB
			DEFINE SCOPE account SESSION 24h
			SIGNUP (
				CREATE user SET email = $email, pass = crypto::argon2::generate($pass)
			)
			SIGNIN (
				SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(pass, $pass)
			);
		');
		`,
		}),
		[],
	);

	return (
		<Article title="Scopes">
			<div>
				<p>
					Within SurrealDB, accesses are a way to manage access to data.
					They are defined within the schema and can be used to
					restrict access to certain parts of the data. To access data
					within an access, you must first sign in with the appropriate
					credentials.
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
