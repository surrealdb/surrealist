import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsAuthTokens({ language }: TopicProps) {
	const snippets = useMemo<Snippets>(
		() => ({
			js: `
// Sign in returns a token pair (access + refresh)
const tokens = await db.signin({
	username: 'root',
	password: 'secret',
});

// Authenticate a future session with an existing token
await db.authenticate(tokens.access);

// Invalidate the current session
await db.invalidate();
`,
			rust: `
use surrealdb::opt::auth::Jwt;

let jwt = db.signin(Root {
	username: "root".into(),
	password: "secret".into(),
}).await?;

// Authenticate with an existing token
db.authenticate(jwt).await?;

// Invalidate the current session
db.invalidate().await?;
`,
			py: `
tokens = await db.signin({"username": "root", "password": "secret"})
await db.authenticate(tokens["access"])
await db.invalidate()
`,
			go: `
token, err := db.SignIn(ctx, &surrealdb.Auth{
	Username: "root",
	Password: "secret",
})

err = db.Authenticate(ctx, token)
err = db.Invalidate(ctx)
`,
			csharp: `
var tokens = await db.SignIn(new RootAuth
{
	Username = "root",
	Password = "secret",
});

await db.Authenticate(tokens.Access);
await db.Invalidate();
`,
			java: `
import com.surrealdb.signin.RootCredential;
import com.surrealdb.signin.Token;

Token token = db.signin(new RootCredential("root", "secret"));

// Re-authenticate with a stored access token
db.authenticate(token.getAccess());

// Invalidate the current session
db.invalidate();
`,
			php: `
$tokens = $db->signin(["username" => "root", "password" => "secret"]);
$db->authenticate($tokens["access"]);
$db->invalidate();
`,
		}),
		[],
	);

	return (
		<Article title="Tokens">
			<Box>
				<Box component="p">
					Signing in or signing up returns a JWT token pair. Persist the access token to
					restore sessions, and use <code>authenticate</code> to apply it to a connection.
					Call <code>invalidate</code> to end the current session.
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Authenticate with a token"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
