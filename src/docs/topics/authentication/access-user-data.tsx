import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useActiveConnection } from "~/hooks/connection";

export function DocsAuthAccessUserData({ language, topic }: TopicProps) {

	const { connection } = useActiveConnection();

	const snippets = useMemo<Snippets>(() => ({
		cli: `
			${connection.namespace}/${connection.database}> $auth;
		`,
		js: `
			await db.info();
		`,
		dotnet: `
		await db.Info<User>();
		`,
		php: `
		// Connect to a local endpoint
		$db = new SurrealDB();
		`,

	}), []);

	return (
		<Article title="Access user data">
			<div>
				<p>
				You can access information about a user that is currently authenticated with a scope. This information includes the user's name, email, and other details.
				</p>
				<p>
					{topic.extra?.table?.schema?.name}
				</p>
			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Access user data"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
