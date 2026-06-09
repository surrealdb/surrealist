import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsSchemaAccess({ language }: TopicProps) {
	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
-- Define record-level access
DEFINE ACCESS account ON DATABASE TYPE RECORD
	DURATION FOR SESSION 24h
	SIGNUP (
		CREATE user SET email = $email, pass = crypto::argon2::generate($pass)
	)
	SIGNIN (
		SELECT * FROM user
		WHERE email = $email
		AND crypto::argon2::compare(pass, $pass)
	);
`,
			js: `
await db.query(\`
	DEFINE ACCESS account ON DATABASE TYPE RECORD
		DURATION FOR SESSION 24h
		SIGNUP (
			CREATE user SET email = $email, pass = crypto::argon2::generate($pass)
		)
		SIGNIN (
			SELECT * FROM user
			WHERE email = $email
			AND crypto::argon2::compare(pass, $pass)
		);
\`);
`,
			rust: `
db.query(r#"
	DEFINE ACCESS account ON DATABASE TYPE RECORD
		DURATION FOR SESSION 24h
		SIGNUP (
			CREATE user SET email = $email, pass = crypto::argon2::generate($pass)
		)
		SIGNIN (
			SELECT * FROM user
			WHERE email = $email
			AND crypto::argon2::compare(pass, $pass)
		);
"#).await?;
`,
			py: `
await db.query("""
	DEFINE ACCESS account ON DATABASE TYPE RECORD
		DURATION FOR SESSION 24h
		SIGNUP (
			CREATE user SET email = $email, pass = crypto::argon2::generate($pass)
		)
		SIGNIN (
			SELECT * FROM user
			WHERE email = $email
			AND crypto::argon2::compare(pass, $pass)
		);
""")
`,
			go: `
_, err := surrealdb.Query[any](ctx, db, \`
	DEFINE ACCESS account ON DATABASE TYPE RECORD
		DURATION FOR SESSION 24h
		SIGNUP (
			CREATE user SET email = $email, pass = crypto::argon2::generate($pass)
		)
		SIGNIN (
			SELECT * FROM user
			WHERE email = $email
			AND crypto::argon2::compare(pass, $pass)
		);
\`, nil)
`,
			csharp: `
await db.RawQuery("""
	DEFINE ACCESS account ON DATABASE TYPE RECORD
		DURATION FOR SESSION 24h
		SIGNUP (
			CREATE user SET email = $email, pass = crypto::argon2::generate($pass)
		)
		SIGNIN (
			SELECT * FROM user
			WHERE email = $email
			AND crypto::argon2::compare(pass, $pass)
		);
""");
`,
			java: `
db.query("""
	DEFINE ACCESS account ON DATABASE TYPE RECORD
		DURATION FOR SESSION 24h
		SIGNUP (
			CREATE user SET email = $email, pass = crypto::argon2::generate($pass)
		)
		SIGNIN (
			SELECT * FROM user
			WHERE email = $email
			AND crypto::argon2::compare(pass, $pass)
		);
""");
`,
			php: `
$db->query('
	DEFINE ACCESS account ON DATABASE TYPE RECORD
		DURATION FOR SESSION 24h
		SIGNUP (
			CREATE user SET email = $email, pass = crypto::argon2::generate($pass)
		)
		SIGNIN (
			SELECT * FROM user
			WHERE email = $email
			AND crypto::argon2::compare(pass, $pass)
		);
');
`,
		}),
		[],
	);

	return (
		<Article title="Access methods">
			<Box>
				<Box component="p">
					Access methods control who can sign in to your database. Use{" "}
					<code>DEFINE ACCESS TYPE RECORD</code> for record-level authentication, and pass
					the <code>access</code> parameter when signing in or signing up via SDKs.
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Define record access"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
