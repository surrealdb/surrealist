import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useActiveConnection } from "~/hooks/connection";
import { connectionUri } from "~/util/helpers";

export function DocsGlobalSignIn({ language, topic }: TopicProps) {

	const { connection } = useActiveConnection();
	const endpoint = connectionUri(connection);
	const esc_namespace = JSON.stringify(connection.namespace);
	const esc_database = JSON.stringify(connection.database);

	const descriptions = {
		cli: `With the SurrealDB CLI, you can only signin via system users. This example shows a command on how to signin with the username and password left blank.`,
		_: `With SurrealDB's SDKs, you can signin as both system and scope users. This example shows how to signin to a scope named user, where the scope's SIGNIN clause requires the email and pass properties.`,
	};

	const snippets = useMemo<Snippets>(() => ({
		cli: `
			$ surreal sql -e ${endpoint} --ns ${connection.namespace} --db ${connection.database} --user ... --pass ...
		`,
		js: `
			const token = await db.signin({
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

			let jwt = db.signin(Scope {
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
		<Article title="Sign In">
			<div>
				<p>
					{descriptions[language as keyof typeof descriptions] ?? descriptions._}
				</p>
				<p>
					{topic.extra?.table?.schema?.name}
				</p>
			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Sign In"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
