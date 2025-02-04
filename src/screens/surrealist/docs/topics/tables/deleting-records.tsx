import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview, TableTitle } from "~/screens/surrealist/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/docs/types";
import { useDocsTable } from "../../hooks/table";

export function DocsTablesDeletingRecords({ language }: TopicProps) {
	const table = useDocsTable();

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
		# Delete all records in a table
db.delete('${table.schema.name}')

# Delete a record with a specific ID
db.delete(RecordID('${table.schema.name}', 'h5wxrf2ewk8xjxosxtyc'))
		`,
			go: `
		db.Delete[models.Table](db, models.Table("${table.schema.name}"));
		`,
			csharp: `
		await db.Delete("${table.schema.name}");
		`,
			java: `
		driver.delete(thing, data)
		`,
			php: `
		$db->delete("${table.schema.name}");
		`,
		}),
		[table.schema.name],
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
					Deleting records is a common operation when you want to remove records from a
					table. This operation is useful when you want to remove records from a table and
					can also be based on certain conditions using the Where clause.
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
