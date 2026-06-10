import { Box } from "@mantine/core";
import { useMemo } from "react";
import {
	Article,
	DocsPreview,
	TableTitle,
} from "~/screens/surrealist/pages/Connection/docs/components";
import { useDocsTable } from "~/screens/surrealist/pages/Connection/docs/hooks/table";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsTablesSelectAllFields({ language }: TopicProps) {
	const table = useDocsTable();
	const tableName = table.schema.name;

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
SELECT * FROM ${tableName};
`,
			js: `
import { Table } from 'surrealdb';

const records = await db.select(new Table('${tableName}'));
`,
			rust: `
let people: Vec<Person> = db.select("${tableName}").await?;
`,
			py: `
records = await db.select('${tableName}')
`,
			go: `
import "github.com/surrealdb/surrealdb.go/pkg/models"

people, err := surrealdb.Select[[]Person](ctx, db, models.Table("${tableName}"))
`,
			csharp: `
var records = await db.Select<Person>("${tableName}");
`,
			java: `
Iterator<Person> records = db.select(Person.class, "${tableName}");
`,
			php: `
$records = $db->select("${tableName}");
`,
		}),
		[tableName],
	);

	return (
		<Article
			title={
				<TableTitle
					title="Selecting all fields"
					table={tableName}
				/>
			}
		>
			<Box component="p">
				Retrieve every field from all records in <b>{tableName}</b>.
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Select all fields"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
