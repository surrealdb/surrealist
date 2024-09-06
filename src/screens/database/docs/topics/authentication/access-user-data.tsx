import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/database/docs/components";
import type { Snippets, TopicProps } from "~/screens/database/docs/types";

export function DocsAuthAccessUserData({ language, topic }: TopicProps) {
	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
			RETURN $auth;
		`,
			js: `
			await db.info();
		`,
			csharp: `
		await db.Info<User>();
		`,
			php: `
		$info = $db->info();
		`,
		}),
		[],
	);

	return (
		<Article title="Access user data">
			<div>
				<p>
					You can access information about a user that is currently
					authenticated with a scope. This information includes the
					user's name, email, and other details.
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
