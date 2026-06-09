import { Box } from "@mantine/core";
import { useMemo } from "react";
import {
	Article,
	DocsPreview,
	TableTitle,
} from "~/screens/surrealist/pages/Connection/docs/components";
import { useDocsTable } from "~/screens/surrealist/pages/Connection/docs/hooks/table";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsTablesDeletingRecords({ language }: TopicProps) {
	const table = useDocsTable();
	const tableName = table.schema.name;

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
-- Delete all records in a table
DELETE ${tableName};

-- Delete a specific record
DELETE ${tableName}:tobie;
`,
			js: `
import { RecordId, Table } from 'surrealdb';

// Delete all records in a table
await db.delete(new Table('${tableName}'));

// Delete a specific record
await db.delete(new RecordId('${tableName}', 'tobie'));
`,
			rust: `
// Delete all records
db.delete("${tableName}").await?;

// Delete a specific record
db.delete(("${tableName}", "tobie")).await?;
`,
			py: `
from surrealdb import RecordID

# Delete all records in a table
await db.delete('${tableName}')

# Delete a specific record
await db.delete(RecordID('${tableName}', 'tobie'))
`,
			go: `
import "github.com/surrealdb/surrealdb.go/pkg/models"

// Delete all records
_, err := surrealdb.Delete[any](ctx, db, models.Table("${tableName}"))

// Delete a specific record
_, err = surrealdb.Delete[any](ctx, db,
	models.RecordID{Table: "${tableName}", ID: "tobie"},
)
`,
			csharp: `
await db.Delete("${tableName}");
await db.Delete("${tableName}:tobie");
`,
			java: `
import com.surrealdb.RecordId;

// Delete all records in a table
db.delete("${tableName}");

// Delete a specific record
db.delete(new RecordId("${tableName}", "tobie"));
`,
			php: `
$db->delete("${tableName}");
$db->delete("${tableName}:tobie");
`,
		}),
		[tableName],
	);

	return (
		<Article
			title={
				<TableTitle
					title="Deleting records"
					table={tableName}
				/>
			}
		>
			<Box component="p">
				Remove all records from <b>{tableName}</b>, or delete a single record by ID.
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Delete records"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
