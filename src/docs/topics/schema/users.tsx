import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useSchema } from "~/hooks/schema";
import { useActiveConnection } from "~/hooks/connection";

export function DocsSchemaUsers({ language, topic }: TopicProps) {
	const schema = useSchema();
	const { connection } = useActiveConnection();

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `

		-- Create a root user
		DEFINE USER username ON ROOT PASSWORD '123456' ROLES OWNER;
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
				-- Create a root user
				DEFINE USER username ON ROOT PASSWORD '123456' ROLES OWNER;
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
		<Article title="Users">
			<div>
				<p>
					Managing permissions for Users within SurrealDB can be done
					using Scopes. Scopes are a way to group permissions together
					and assign them to Users with scopes you can manage
					authentication and access control for your table and fields.
				</p>

			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Users"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
