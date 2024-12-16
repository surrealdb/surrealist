import { Box } from "@mantine/core";
import { useMemo } from "react";
import { useConnection } from "~/hooks/connection";
import { Article, DocsPreview } from "~/screens/surrealist/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/docs/types";

export function DocsAuthSignUp({ language }: TopicProps) {
	const [namespace, database] = useConnection((c) => [
		c?.authentication.namespace ?? "",
		c?.authentication.database ?? "",
	]);

	const esc_namespace = JSON.stringify(namespace);
	const esc_database = JSON.stringify(database);

	const snippets = useMemo<Snippets>(
		() => ({
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
			use surrealdb::opt::auth::Record;

			#[derive(Serialize)]
			struct Credentials<'a> {
				email: &'a str,
				pass: &'a str,
			}

			let jwt = db.signup(Record {
				namespace: ${esc_namespace},
				database: ${esc_database},
				access: "user",
				params: Credentials {
					email: "info@surrealdb.com",
					pass: "123456",
				},
			}).await?;

			let token = jwt.as_insecure_token();
		`,
			py: `
		token = await db.signup({
			'NS': 'test',
			'DB': 'test',
			'SC': 'user',
			'email': 'info@surrealdb.com',
			'pass': '123456',
		})
		`,
			go: `
		db.Signup(map[string]string{
			"NS": "clear-crocodile-production",
			"DB": "web-scraping-application",
			"SC": "user",
			"email": "info@surrealdb.com",
			"pass": "123456",
		})
		`,
			csharp: `
		var authParams = new AuthParams
		{
			Namespace = "test",
			Database = "test",
			Scope = "user",
			Email = "info@surrealdb.com",
			Password = "123456"
		};

		Jwt jwt = await db.SignUp(authParams);

		public class AuthParams : ScopeAuth
		{
			public string? Username { get; set; }
			public string? Email { get; set; }
			public string? Password { get; set; }
		}
		`,
			java: `
		driver.signUp(namespace, database, scope, email, password)
		`,
			php: `
		$jwt = $db->signup([
			"user" => "user",
			"pass" => "password",
			"namespace" => "test",
			"database" => "test",
			"scope" => "user"
		]);
		`,
		}),
		[esc_namespace, esc_database],
	);

	return (
		<Article title="Sign Up">
			<div>
				<p>
					When working with SurrealDB Scopes, you can let anonymous users signup and
					create an account in your database. In a scope's SIGNUP-clause, you can specify
					variables which later need to be passed in an SDK or Web Request, email and pass
					in this case. The scope is called user for this example.
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
