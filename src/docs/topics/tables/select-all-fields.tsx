import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview, TableTitle } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useActiveConnection } from "~/hooks/connection";
import { getTable } from "~/docs/helpers";

export function DocsTablesSelectAllFields({ language, topic }: TopicProps) {
	const table = getTable(topic);
	const { connection } = useActiveConnection();

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
		SELECT * FROM ${table.schema.name}
		`,
			js: `
		db.select('${table.schema.name}');
		`,
			rust: `
		let people: Vec<Person> = db.select("${table.schema.name}").await?;
		`,
			py: `
		db.select('${table.schema.name}');
		`,
			go: `
		db.Select('${table.schema.name}');
		`,
			csharp: `
		db.Select('${table.schema.name}');
		`,
			java: `
		driver.select("thing", rowType)
		`,
			php: `
		// Connect to a local endpoint
		$db = new SurrealDB();
		`,
		}),
		[]
	);

	return (
		<Article
			title={
				<TableTitle
					title="Selecting all fields"
					table={table.schema.name}
				/>
			}
		>
			<div>
				<p>
					Selecting all fields in a table is a common operation when
					you want to retrieve all the fields in a table. This
					operation is useful when you want to retrieve all the fields
					in a table without specifying the fields explicitly.
				</p>
			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Selecting all fields"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
