import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview, TableTitle } from "~/screens/database/docs/components";
import { Snippets, TopicProps } from "~/screens/database/docs/types";
import { getTable } from "~/screens/database/docs/helpers";
import { pascal } from "radash";

export function DocsTablesSelectAllFields({ language, topic }: TopicProps) {
	const table = getTable(topic);

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
		await db.Select<${pascal(table.schema.name)}>("${table.schema.name}");
		`,
			java: `
		driver.select("thing", rowType)
		`,
			php: `
		$db->select("${table.schema.name}");
		`,
		}),
		[table.schema.name]
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
