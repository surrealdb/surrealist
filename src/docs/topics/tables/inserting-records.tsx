import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useSchema } from "~/hooks/schema";
import { useActiveConnection } from "~/hooks/connection";

export function DocsTablesInsertingRecords({ language, topic }: TopicProps) {
	const { connection } = useActiveConnection();
	const schema = useSchema();

	const snippets = useMemo<Snippets>(() => ({
		cli: `
		${connection.namespace}/${connection.database}> INSERT INTO ${topic.extra?.table?.schema?.name} {
			field: value
		};
		`,
		js: `
		await db.insert('${topic.extra?.table?.schema?.name}', {
			field: value
		});
		`,
		rust: `
		db.update("${topic.extra?.table?.schema?.name}").merge(Document {
        updated_at: Datetime::default(),
	}).await?;
		`,
		py: `
		await db.query("""
        insert into ${topic.extra?.table?.schema?.name} {
        	field:value
        };
		`,
		go: `
		db.Query("INSERT INTO ${topic.extra?.table?.schema?.name} {
			field: value
		};")
		`,
		dotnet: `
		await db.Merge<${topic.extra?.table?.schema?.name}>(merge);
		`,
		java:`
		`,
		php: `
		// Connect to a local endpoint
		$db = new SurrealDB();
		`,

	}), []);

	return (
		<Article title="Inserting Records">
			<div>
				<h3> Table: {topic.extra?.table?.schema?.name} </h3>
				<p>
					Insert records into a table in the database. It could also be used to update existing fields in records within a table.
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
