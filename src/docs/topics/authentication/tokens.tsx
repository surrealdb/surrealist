import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useSchema } from "~/hooks/schema";

export function DocsAuthTokens({ language, topic }: TopicProps) {
	const schema = useSchema();

	const snippets = useMemo<Snippets>(
		() => ({
			js: `
			await db.authenticate("...");
		`,
			rust: `
			use surrealdb::opt::auth::Jwt;

			let jwt = Jwt::from("...");
			db.authenticate(jwt).await?;
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
		db.Authenticate("jwt")
		`,
			csharp: `
		// Sign in or sign up as a scoped user
		Jwt jwt = await db.SignUp(authParams);

		await db.Authenticate(jwt);
		`,
			java: `
		// Connect to a local endpoint
		driver.authenticate(token)
		`,
			php: `
		// Connect to a local endpoint
		$db = new SurrealDB();
		`,
		}),
		[]
	);

	return (
		<Article title="Tokens">
			<div>
				<p>
					When signin in or up to SurrealDB, you receive a JWT token.
					This JWT, for the time it lives, can be used to authenticate
					future sessions to SurrealDB. As an integrator, you are
					expected yourself to persist this token, if you need to
					retrieve it at a later moment in time.
				</p>
			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Authenticate with an issued token"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
