import { Box } from "@mantine/core";
import { useMemo } from "react";
import { useConnection } from "~/hooks/connection";
import { Article, DocsPreview } from "~/screens/surrealist/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/docs/types";

export function DocsGlobalNamespaces({ language }: TopicProps) {
	const [namespace] = useConnection((c) => [
		c?.authentication.namespace ?? "",
	]);

	const esc_namespace = JSON.stringify(namespace);

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
			USE NS ${esc_namespace};
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
		await db.use(namespace=${esc_namespace})
		`,
			go: `
		db.Use(namespace:${esc_namespace})
		`,
			csharp: `
		await db.Use(${esc_namespace});
		`,
			java: `
		driver.use(namespace:${esc_namespace});
		`,
			php: `
		$db->use([
			"namespace" => "test"
		]);
		`,
		}),
		[esc_namespace],
	);

	return (
		<Article title="Namespaces">
			<div>
				<p>
					After connecting to a SurrealDB instance, you can specify the namespace to use.
					Namespaces are used to group related data together, contains information
					regarding the users, roles, tokens, and databases it contains.
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
