import { Box } from "@mantine/core";
import { useMemo } from "react";
import { useConnection } from "~/hooks/connection";
import { Article, DocsPreview } from "~/screens/surrealist/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/docs/types";
import { createBaseAuthentication } from "~/util/defaults";
import { connectionUri } from "~/util/helpers";

export function DocsAuthSignIn({ language }: TopicProps) {
	const authentication = useConnection((c) => c?.authentication ?? createBaseAuthentication());
	const endpoint = connectionUri(authentication);
	const esc_endpoint = JSON.stringify(endpoint);
	const esc_namespace = JSON.stringify(authentication.namespace);
	const esc_database = JSON.stringify(authentication.database);

	const descriptions = {
		cli: `With the CLI's surreal sql command, you can sign in as a system (Root, Namespace and Database) users. This example shows a command on how to sign in as a root user with the username and password left blank.`,
		_: `With SurrealDB's SDKs, you can signin both system (Root, Namespace and Database) users and scope users. The example shows how to sigin a new user based on the credentials required for access.`,
	};

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
			surreal sql  -e ${esc_endpoint} --ns ${esc_namespace} --db ${esc_database} --user ... --pass ...
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

		// Sign in a Record user
		db.signin(Scope {
			namespace: "test",
			database: "test",
			access: "user",
			params: Credentials {
				email: "info@surrealdb.com",
				pass: "123456",
			},
		}).await?;
		`,
			py: `
		# Authenticate with a root user
db.signin({
	"database": 'root',
	"password": 'surrealdb',
})

# Authenticate with a Namespace user
db.signin({
	"namespace": 'surrealdb',
	"username": 'tobie',
	"password": 'surrealdb',
})

# Authenticate with a Database user
db.signin({
	"namespace": 'surrealdb',
	"database": 'docs',
	"username": 'tobie',
	"password": 'surrealdb',
})

# Authenticate with a Access method 
db.signin({
	"namespace": 'surrealdb',
	"database": 'docs',
	"access": 'user',
   # Also pass any properties required by the access definition
	"variables": {
        "email": 'info@surrealdb.com',
        "password": '123456'
    }
})
		`,
			go: `
	// Sign in as a root user
	authData := &surrealdb.Auth{
		Username: "root", // use your setup username
		Password: "root", // use your setup password
	}
	token, err := db.SignIn(authData)
	if err != nil {
		panic(err)
	}

	// Sign in to authentication db using the namespace user
	authData := &surrealdb.Auth{
		Username: "root", // use your setup username
		Password: "root", // use your setup password
        Namespace = "test", 
	}
	token, err := db.SignIn(authData)
	if err != nil {
		panic(err)
	}

	// Sign in to authentication db using the database user
	authData := &surrealdb.Auth{
		Username: "root", // use your setup username
		Password: "root", // use your setup password
        Namespace = "test", 
        Database = "test",
	}
	token, err := db.SignIn(authData)
	if err != nil {
		panic(err)
	}

	// Sign in to authentication db using the record accessmethod
	authData := &surrealdb.Auth{
		Username: "root", // use your setup username
		Password: "root", // use your setup password
        Namespace = "test", 
        Database = "test",
		Access = "user",
        Email = "info@surrealdb.com",
        Password = "123456"
		}
		token, err := db.SignIn(authData)
		if err != nil {
			panic(err)
		}
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
		$jtw = $db->signin([
			"user" => "user",
			"pass" => "password",
			"namespace" => "test",
			"database" => "test",
			"scope" => "user"
		]);
		`,
		}),
		[esc_endpoint, esc_namespace, esc_database],
	);

	return (
		<Article title="Sign In">
			<div>
				<p>{descriptions[language as keyof typeof descriptions] ?? descriptions._}</p>
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
