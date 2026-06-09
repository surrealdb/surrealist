import { Box } from "@mantine/core";
import { useMemo } from "react";
import {
	Article,
	DocsPreview,
	TableTitle,
} from "~/screens/surrealist/pages/Connection/docs/components";
import { useDocsTable } from "~/screens/surrealist/pages/Connection/docs/hooks/table";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsTablesUpdatingRecords({ language }: TopicProps) {
	const table = useDocsTable();
	const tableName = table.schema.name;

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
-- Update all records in a table
UPDATE ${tableName} SET active = true;

-- Update a specific record
UPDATE ${tableName}:tobie SET name = "Tobie";

-- Upsert creates the record if it does not exist
UPSERT ${tableName}:tobie SET name = "Tobie", active = true;
`,
			js: `
import { RecordId, Table } from 'surrealdb';

// Update all records in a table
await db.update(new Table('${tableName}'))
	.merge({ active: true });

// Update a specific record
const [record] = await db.update(new RecordId('${tableName}', 'tobie'))
	.merge({ name: 'Tobie', active: true });

// Upsert creates the record if it does not exist
await db.upsert(new RecordId('${tableName}', 'tobie'))
	.content({ name: 'Tobie', active: true });
`,
			rust: `
// Update all records
db.update("${tableName}")
	.merge(json!({ "active": true }))
	.await?;

// Update a specific record
db.update(("${tableName}", "tobie"))
	.merge(json!({ "name": "Tobie", "active": true }))
	.await?;

// Upsert
db.upsert(("${tableName}", "tobie"))
	.content(json!({ "name": "Tobie", "active": true }))
	.await?;
`,
			py: `
from surrealdb import RecordID

# Update all records
await db.update('${tableName}', {"active": True})

# Update a specific record
await db.update(RecordID('${tableName}', 'tobie'), {"name": "Tobie"})

# Upsert
await db.upsert(RecordID('${tableName}', 'tobie'), {"name": "Tobie", "active": True})
`,
			go: `
import "github.com/surrealdb/surrealdb.go/pkg/models"

// Update a specific record
updated, err := surrealdb.Update[Person](ctx, db,
	models.RecordID{Table: "${tableName}", ID: "tobie"},
	map[string]any{"name": "Tobie", "active": true},
)

// Upsert
upserted, err := surrealdb.Upsert[Person](ctx, db,
	models.RecordID{Table: "${tableName}", ID: "tobie"},
	map[string]any{"name": "Tobie", "active": true},
)
`,
			csharp: `
await db.Merge("${tableName}", new { active = true });
await db.Merge("${tableName}:tobie", new { name = "Tobie" });
await db.Upsert("${tableName}:tobie", new { name = "Tobie", active = true });
`,
			java: `
import com.surrealdb.RecordId;
import com.surrealdb.UpType;

// Update all records in a table
db.update("${tableName}", UpType.MERGE, Map.of("active", true));

// Update a specific record
db.update(new RecordId("${tableName}", "tobie"), UpType.MERGE, updated);

// Upsert creates the record if it does not exist
db.upsert(new RecordId("${tableName}", "tobie"), UpType.CONTENT, person);
`,
			php: `
$db->merge("${tableName}", ["active" => true]);
$db->merge("${tableName}:tobie", ["name" => "Tobie"]);
$db->upsert("${tableName}:tobie", ["name" => "Tobie", "active" => true]);
`,
		}),
		[tableName],
	);

	return (
		<Article
			title={
				<TableTitle
					title="Updating records"
					table={tableName}
				/>
			}
		>
			<Box component="p">
				Update existing records in <b>{tableName}</b>. <code>UPDATE</code> modifies existing
				records only — use <code>UPSERT</code> to create a record when it does not exist.
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Update records"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
