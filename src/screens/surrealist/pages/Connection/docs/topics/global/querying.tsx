import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import { useDocsTable } from "~/screens/surrealist/pages/Connection/docs/hooks/table";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsGlobalQuerying({ language }: TopicProps) {
	const table = useDocsTable();
	const tableName = table.schema.name;

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
-- Run a SurrealQL query with bound parameters
LET $name = "Tobie";
CREATE ${tableName} SET name = $name;
SELECT * FROM type::table($table);
`,
			js: `
import { Table } from 'surrealdb';

type Person = { id: string; name: string };

// Run SurrealQL with typed results and bound variables
const result = await db.query<[Person[], Person[]]>(
	'CREATE person SET name = $name; SELECT * FROM type::table($table);',
	{ name: 'Tobie', table: '${tableName}' },
);

// Or use the chainable query builder
const records = await db.select(new Table('${tableName}'));
`,
			rust: `
use surrealdb_types::SurrealValue;

#[derive(SurrealValue)]
struct Person { name: String }

let mut result = db
	.query("CREATE person SET name = $name; SELECT * FROM type::table($table)")
	.bind(("name", "Tobie"))
	.bind(("table", "${tableName}"))
	.await?;

let created: Option<Person> = result.take(0)?;
let people: Vec<Person> = result.take(1)?;
`,
			py: `
from surrealdb import RecordID

# Run SurrealQL with bound parameters
result = await db.query(
	"CREATE person SET name = $name; SELECT * FROM type::table($table)",
	{"name": "Tobie", "table": "${tableName}"},
)

# Select all records from a table
records = await db.select("${tableName}")
`,
			go: `
import "github.com/surrealdb/surrealdb.go/pkg/models"

type Person struct {
	Name string \`json:"name"\`
}

results, err := surrealdb.Query[[]Person](ctx, db,
	"SELECT * FROM type::table($table)",
	map[string]any{"table": "${tableName}"},
)
`,
			csharp: `
var result = await db.RawQuery(
	"CREATE person SET name = $name; SELECT * FROM type::table($table);",
	new Dictionary<string, object?>
	{
		{ "name", "Tobie" },
		{ "table", "${tableName}" },
	},
);
`,
			java: `
import com.surrealdb.Response;

Response response = db.queryBind(
	"CREATE person SET name = $name; SELECT * FROM type::table($table)",
	Map.of("name", "Tobie", "table", "${tableName}")
);

List<Person> people = response.take(Person.class, 1);
`,
			php: `
$results = $db->query(
	"SELECT * FROM type::table($table)",
	["table" => "${tableName}"],
);
`,
		}),
		[tableName],
	);

	return (
		<Article title="Querying with SurrealQL">
			<Box>
				<Box component="p">
					Every SDK provides a <code>query</code> method for running SurrealQL statements.
					Use bound parameters (<code>$name</code>) instead of string interpolation to
					keep queries safe and CBOR-compatible. Use <code>LET $variable =</code> when
					assigning session parameters.
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Run SurrealQL queries"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
