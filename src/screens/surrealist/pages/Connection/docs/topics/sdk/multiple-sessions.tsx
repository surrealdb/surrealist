import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import { useDocsConnection } from "~/screens/surrealist/pages/Connection/docs/hooks/connection";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsSdkMultipleSessions({ language }: TopicProps) {
	const { esc_namespace, esc_database } = useDocsConnection();

	const snippets = useMemo<Snippets>(
		() => ({
			js: `
// Create an isolated session on the same connection
const session = await db.newSession();

await session.use({
	namespace: ${esc_namespace},
	database: ${esc_database},
});

await session.signin({
	username: 'root',
	password: 'secret',
});

// Fork an existing session for branching auth contexts
const forked = await session.forkSession();
`,
			py: `
session = db.new_session()
await session.use(${esc_namespace}, ${esc_database})
await session.signin({"username": "root", "password": "secret"})
`,
			go: `
session, err := db.Attach(ctx)
defer session.Detach(ctx)

err = session.Use(ctx, ${esc_namespace}, ${esc_database})
`,
			java: `
Surreal session = db.newSession();
session.useNs(${esc_namespace}).useDb(${esc_database});
session.signin(new RootCredential("root", "secret"));
`,
			csharp: `
var session = await db.CreateSession();
await session.Use(${esc_namespace}, ${esc_database});
await session.SignIn(new RootAuth { Username = "root", Password = "secret" });

var forked = await session.ForkSession();
`,
		}),
		[esc_namespace, esc_database],
	);

	return (
		<Article title="Multiple sessions">
			<Box>
				<Box component="p">
					A single WebSocket connection can host multiple isolated sessions, each with its
					own namespace, database, and authentication context. Useful for multi-tenant
					applications that multiplex clients over one connection.
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Multiple sessions"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
