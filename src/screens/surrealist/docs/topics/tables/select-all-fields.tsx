import { Box } from "@mantine/core";
import { pascal } from "radash";
import { useMemo } from "react";
import { Article, DocsPreview, TableTitle } from "~/screens/surrealist/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/docs/types";
import { useDocsTable } from "../../hooks/table";

export function DocsTablesSelectAllFields({ language }: TopicProps) {
	const table = useDocsTable();
	const fieldName =
		table.fields.find(({ name }: { name: string }) => !["id", "in", "out"].includes(name))
			?.name ?? "id";

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
		db.Select[[]${table.schema.name}, models.Table](db, models.Table("${fieldName}"))
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
		[table.schema.name, fieldName],
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
					Selecting all fields in a table is a common operation when you want to retrieve
					all the fields in a table. This operation is useful when you want to retrieve
					all the fields in a table without specifying the fields explicitly.
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
