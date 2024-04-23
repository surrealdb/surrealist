import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useActiveConnection } from "~/hooks/connection";
import { connectionUri } from "~/util/helpers";

export function DocsAuthSignIn({ language, topic }: TopicProps) {
	const { connection } = useActiveConnection();
	const endpoint = connectionUri(connection);

	const descriptions = {
		cli: `With the SurrealDB CLI, you can only signin via system(Root, Namespace and Database) users. This example shows a command on how to signin with the username and password left blank.`,
		_: `With SurrealDB's SDKs, you can signin both system (Root, Namespace and Database) users and scope users. The example shows how to sigin a new user based on the credentials required for access.`,
	};

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
			surreal sql  -e ${endpoint} --ns ${connection.namespace} --db ${connection.database} --user ... --pass ...
		`,
			js: `
		// Authenticate with a root user
		await db.signin({
			username: 'root',
			password: 'surrealdb',
		});

		// Authenticate with a Namespace user
		await db.signin({
			namespace: 'surrealdb',
			username: 'tobie',
			password: 'surrealdb',
		});

		// Authenticate with a Database user
		await db.signin({
			namespace: 'surrealdb',
			database: 'docs',
			username: 'tobie',
			password: 'surrealdb',
		});

		// Authenticate with a Scope user
		await db.signin({
			namespace: 'surrealdb',
			database: 'docs',
			scope: 'user',

			// Also pass any properties required by the scope definition
			email: 'info@surrealdb.com',
			pass: '123456',
		});
		`,
			rust: `
		// Sign in a Root user
		db.signin(Root {
			params: Credentials {
				email: "info@surrealdb.com",
				pass: "123456",
			},
		}).await?;

		// Sign in a Namespace user
		db.signin(Namespace {
			namespace: "test",
			params: Credentials {
				email: "info@surrealdb.com",
				pass: "123456",
			},
		}).await?;

		// Sign in a Database user
		db.signin(Database {
			namespace: "test",
			database: "test",
			params: Credentials {
				email: "info@surrealdb.com",
				pass: "123456",
			},
		}).await?;

		// Sign in a Scope user
		db.signin(Scope {
			namespace: "test",
			database: "test",
			scope: "user",
			params: Credentials {
				email: "info@surrealdb.com",
				pass: "123456",
			},
		}).await?;
		`,
			py: `
		token = await db.signin({
			'user': 'root',
			'pass': 'root',
		})
		token = await db.signin({
			'user': 'root',
			'pass': 'root',
			'namespace': 'test',
			'database': 'test',
			'scope': 'user',
		})
		`,
			go: `
		db.Signin(map[string]string{
			"user": "root",
			"pass": "root",
		})
		`,
			csharp: `
		// Sign in as root user
		await db.SignIn(
			new RootAuth
			{
				Username = "root",
				Password = "root"
			}
		);

		// Sign in using namespace auth
		await db.SignIn(
			new NamespaceAuth
			{
				Namespace = "test",
				Username = "johndoe",
				Password = "password123"
			}
		);

		// Sign in using database auth
		await db.SignIn(
			new DatabaseAuth
			{
				Namespace = "test",
				Database = "test",
				Username = "johndoe",
				Password = "password123"
			}
		);

		// Sign in as a scoped user
		var authParams = new AuthParams
		{
			Namespace = "test",
			Database = "test",
			Scope = "user",
			Email = "info@surrealdb.com",
			Password = "123456"
		};

		Jwt jwt = await db.SignIn(authParams);

		public class AuthParams : ScopeAuth
		{
			public string? Username { get; set; }
			public string? Email { get; set; }
			public string? Password { get; set; }
		}
		`,
			java: `
		// Connect to a local endpoint
		driver.signIn(user, pass)
		`,
			php: `
		// Connect to a local endpoint
		$db = new SurrealDB();
		`,
		}),
		[]
	);

	return (
		<Article title="Sign In">
			<div>
				<p>
					{descriptions[language as keyof typeof descriptions] ??
						descriptions._}
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
