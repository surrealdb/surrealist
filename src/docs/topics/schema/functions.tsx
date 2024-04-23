import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useSchema } from "~/hooks/schema";
import { useActiveConnection } from "~/hooks/connection";

export function DocsSchemaFunctions({ language, topic }: TopicProps) {
	const schema = useSchema();
	const { connection } = useActiveConnection();

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
		-- It is necessary to prefix the name of your function with "fn::"
		-- This indicates that it's a custom function
		DEFINE FUNCTION fn::greet($name: string) {
			RETURN "Hello, " + $name + "!";
		}

		-- Returns: "Hello, BOB!"
		RETURN fn::greet("BOB");
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
					-- It is necessary to prefix the name of your function with "fn::"
					-- This indicates that it's a custom function
					DEFINE FUNCTION fn::greet($name: string) {
						RETURN "Hello, " + $name + "!";
					}

					-- Returns: "Hello, BOB!"
					RETURN fn::greet("BOB");
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
		<Article title="Functions">
			<div>
				<p>
					Functions are a way to encapsulate logic in a database. To
					define functions you have to be a system user
					(namespace,database,root) They can be used to perform
					calculations, manipulate data, or perform other operations.
					In SurrealDB functions can be written just as you would in
					your programming language of choice.
				</p>

			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Functions"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
