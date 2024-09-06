import { Box } from "@mantine/core";
import { useMemo } from "react";
import { useActiveConnection } from "~/hooks/connection";
import { Article, DocsPreview } from "~/screens/database/docs/components";
import type { Snippets, TopicProps } from "~/screens/database/docs/types";

export function DocsGlobalDatabases({ language }: TopicProps) {
	const { authentication } = useActiveConnection();
	const esc_namespace = JSON.stringify(authentication.namespace);
	const esc_database = JSON.stringify(authentication.database);

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
			USE DB ${esc_database};
		`,
			js: `
			await db.use({
				database: ${esc_database}
			});
		`,
			rust: `
			db.use_db(${esc_database}).await?;
		`,
			py: `
		await db.use(database:${esc_database})
		`,
			go: `
		db.Use(database:${esc_database})
		`,
			csharp: `
		await db.Use(${esc_namespace}, ${esc_database});
		`,
			java: `
		// Connect to a local endpoint
		driver.use(${esc_database});
		`,
			php: `
		$db->use([
			"database" => "test"
		]);
		`,
		}),
		[esc_namespace, esc_database],
	);

	return (
		<Article title="Databases">
			<div>
				<p>
					The database is the primary storage in a namespace. It
					contains the tables, views, and indexes that are used to
					store and retrieve data.You can specify which database to
					use and also switch between multiple databases.
				</p>
			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Define the database to use for the connection"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
