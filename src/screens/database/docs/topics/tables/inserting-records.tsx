import { Box } from "@mantine/core";
import { useMemo } from "react";
import {
	Article,
	DocsPreview,
	TableTitle,
} from "~/screens/database/docs/components";
import { getTable } from "~/screens/database/docs/helpers";
import type { Snippets, TopicProps } from "~/screens/database/docs/types";

export function DocsTablesInsertingRecords({ language, topic }: TopicProps) {
	const table = getTable(topic);

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
		INSERT INTO ${table.schema.name} {
			field: value
		};
		`,
			js: `
		await db.insert('${table.schema.name}', {
			field: value
		});
		`,
			rust: `
		db.update("${table.schema.name}").merge(Document {
        updated_at: Datetime::default(),
	}).await?;
		`,
			py: `
		await db.query("""
        insert into ${table.schema.name} {
        	field:value
        };
		`,
			go: `
		db.Query("INSERT INTO ${table.schema.name} {
			field: value
		};")
		`,
			csharp: `
		await db.Merge("${table.schema.name}", data);
		`,
			java: `
		`,
			php: `
		$db->insert("${table.schema.name}", [
			["field" => "value"],
			["field" => "value"]
		]);
		`,
		}),
		[table.schema.name],
	);

	return (
		<Article
			title={
				<TableTitle
					title="Inserting records"
					table={table.schema.name}
				/>
			}
		>
			<div>
				<p>
					Insert records into a table in the database. It could also
					be used to update existing fields in records within a table.
				</p>
			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Inserting Records"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
