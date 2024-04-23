import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useActiveConnection } from "~/hooks/connection";

export function DocsGlobalDatabases({ language, topic }: TopicProps) {
	const { connection } = useActiveConnection();
	const esc_namespace = JSON.stringify(connection.namespace);
	const esc_database = JSON.stringify(connection.database);

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
			USE DB ${connection.database};
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
		// Connect to a local endpoint
		$db = new SurrealDB();
		`,
		}),
		[]
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
