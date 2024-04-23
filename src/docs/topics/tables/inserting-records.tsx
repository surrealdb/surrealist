import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview, TableTitle } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useActiveConnection } from "~/hooks/connection";
import { getTable } from "~/docs/helpers";

export function DocsTablesInsertingRecords({ language, topic }: TopicProps) {
	const table = getTable(topic);
	const { connection } = useActiveConnection();

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
		await db.Merge<${table.schema.name}>(merge);
		`,
			java: `
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
