import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useActiveConnection } from "~/hooks/connection";

export function DocsGlobalNamespaces({ language, topic }: TopicProps) {
	const { connection } = useActiveConnection();
	const esc_namespace = JSON.stringify(connection.namespace);
	const esc_database = JSON.stringify(connection.database);

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
			USE NS ${connection.namespace};
		`,
			js: `
			await db.use({
				namespace: ${esc_namespace}
			});
		`,
			rust: `
			db.use_ns(${esc_namespace}).await?;
		`,
			py: `
		await db.use(namespace:${esc_namespace})
		`,
			go: `
		db.Use(namespace:${esc_namespace})
		`,
			csharp: `
		await db.Use(${esc_namespace}, ${esc_database});
		`,
			java: `
		driver.use(namespace:${esc_namespace});
		`,
			php: `
		// Connect to a local endpoint
		$db = new SurrealDB();
		`,
		}),
		[]
	);

	return (
		<Article title="Namespaces">
			<div>
				<p>
					After connecting to a SurrealDB instance, you can specify
					the namespace to use. Namespaces are used to group related
					data together this contains information regarding the users,
					roles, tokens, and databases that are available to the
					namespace.
				</p>
			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Define the namespaces to use for the connection"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
