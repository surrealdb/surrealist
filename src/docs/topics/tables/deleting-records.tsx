import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview, TableTitle } from "~/docs/components";
import { getTable } from "~/docs/helpers";
import { Snippets, TopicProps } from "~/docs/types";
import { useActiveConnection } from "~/hooks/connection";

export function DocsTablesDeletingRecords({ language, topic }: TopicProps) {
	const table = getTable(topic);
	const { connection } = useActiveConnection();

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
		DELETE ${table.schema.name}:demo
		`,
			js: ` 
		db.delete('${table.schema.name}');
		`,
			rust: `
		db.delete("${table.schema.name}").await?;
		`,
			py: `
		db.delete('${table.schema.name}')
		`,
			go: `
		db.Delete("${table.schema.name}", map[string]interface{}{})
		`,
			csharp: `
		db.delete<${table.schema.name}>("${table.schema.name}");
		`,
			java: `
		driver.delete(thing, data)
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
					title="Deleting records"
					table={table.schema.name}
				/>
			}
		>
			<div>
				<p>
					Deleting records is a common operation when you want to
					remove records from a table. This operation is useful when
					you want to remove records from a table and can also be
					based on certain conditions using the Where clause.
				</p>
			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Deleting Records"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
