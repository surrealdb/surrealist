import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useActiveConnection } from "~/hooks/connection";

export function DocsGlobalSignUp({ language, topic }: TopicProps) {

	const { connection } = useActiveConnection();
	const esc_namespace = JSON.stringify(connection.namespace);
	const esc_database = JSON.stringify(connection.database);

	const snippets = useMemo<Snippets>(() => ({
		js: `
			await db.signup({
				namespace: ${esc_namespace},
				database: ${esc_database},
				scope: "user",
				email: "info@surrealdb.com",
				pass: "123456",
			});
		`,
		rust: `
			use serde::Serialize;
			use surrealdb::opt::auth::Scope;

			#[derive(Serialize)]
			struct Credentials<'a> {
				email: &'a str,
				pass: &'a str,
			}

			let jwt = db.signup(Scope {
				namespace: ${esc_namespace},
				database: ${esc_database},
				scope: "user",
				params: Credentials {
					email: "info@surrealdb.com",
					pass: "123456",
				},
			}).await?;

			let token = jwt.as_insecure_token();
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
		<Article title="Sign Up">
			<div>
				<p>
					When working with SurrealDB Scopes, you can let anonymous users signup and create an account in your database. In a scope's SIGNUP-clause, you can specify variables which later need to be passed in an SDK or Web Request, email and pass in this case. The scope is called user for this example.
				</p>
				<p>
					{topic.extra?.table?.schema?.name}
				</p>
			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Sign Up"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
