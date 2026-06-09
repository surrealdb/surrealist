import { Box } from "@mantine/core";
import { useMemo } from "react";
import {
	Article,
	DocsPreview,
	TableTitle,
} from "~/screens/surrealist/pages/Connection/docs/components";
import { useDocsTable } from "~/screens/surrealist/pages/Connection/docs/hooks/table";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsTablesCreatingRecords({ language }: TopicProps) {
	const table = useDocsTable();
	const tableName = table.schema.name;

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
-- Create a record with a random ID
CREATE ${tableName} SET name = "Tobie";

-- Create a record with a specific ID
CREATE ${tableName}:tobie SET name = "Tobie";
`,
			js: `
import { RecordId, Table } from 'surrealdb';

// Create a record with a random ID
const record = await db.create(new Table('${tableName}'))
	.content({ name: 'Tobie' });

// Create a record with a specific ID
const tobie = await db.create(new RecordId('${tableName}', 'tobie'))
	.content({ name: 'Tobie' });
`,
			rust: `
// Create a record with a random ID
let person: Option<Person> = db.create("${tableName}")
	.content(Person { name: "Tobie".into() })
	.await?;

// Create a record with a specific ID
let tobie: Option<Person> = db.create(("${tableName}", "tobie"))
	.content(Person { name: "Tobie".into() })
	.await?;
`,
			py: `
from surrealdb import RecordID

# Create a record with a random ID
person = await db.create('${tableName}', {"name": "Tobie"})

# Create a record with a specific ID
tobie = await db.create(RecordID('${tableName}', 'tobie'), {"name": "Tobie"})
`,
			go: `
import "github.com/surrealdb/surrealdb.go/pkg/models"

// Create a record with a random ID
created, err := surrealdb.Create[Person](ctx, db,
	models.Table("${tableName}"),
	map[string]any{"name": "Tobie"},
)

// Create a record with a specific ID
tobie, err := surrealdb.Create[Person](ctx, db,
	models.RecordID{Table: "${tableName}", ID: "tobie"},
	map[string]any{"name": "Tobie"},
)
`,
			csharp: `
// Create a record with a random ID
var created = await db.Create("${tableName}", new { name = "Tobie" });

// Create a record with a specific ID
var tobie = await db.Create("${tableName}:tobie", new { name = "Tobie" });
`,
			java: `
import com.surrealdb.RecordId;

// Create a record with a random ID
List<Person> created = db.create(Person.class, "${tableName}", person);

// Create a record with a specific ID
Person tobie = db.create(
	Person.class,
	new RecordId("${tableName}", "tobie"),
	person
);
`,
			php: `
// Create a record with a random ID
$person = $db->create("${tableName}", ["name" => "Tobie"]);

// Create a record with a specific ID
$tobie = $db->create("${tableName}:tobie", ["name" => "Tobie"]);
`,
		}),
		[tableName],
	);

	return (
		<Article
			title={
				<TableTitle
					title="Creating records"
					table={tableName}
				/>
			}
		>
			<Box component="p">
				Add a new record to <b>{tableName}</b>. Omit the record ID to generate one
				automatically, or specify an ID after the table name.
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Create records"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
