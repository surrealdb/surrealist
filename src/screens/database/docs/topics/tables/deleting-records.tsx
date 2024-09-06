import { Box } from "@mantine/core";
import { useMemo } from "react";
import {
	Article,
	DocsPreview,
	TableTitle,
} from "~/screens/database/docs/components";
import { getTable } from "~/screens/database/docs/helpers";
import type { Snippets, TopicProps } from "~/screens/database/docs/types";

export function DocsTablesDeletingRecords({ language, topic }: TopicProps) {
	const table = getTable(topic);

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
