import { Box } from "@mantine/core";
import { useMemo } from "react";
import {
	Article,
	DocsPreview,
	TableTitle,
} from "~/screens/surrealist/pages/Connection/docs/components";
import { useDocsTable } from "~/screens/surrealist/pages/Connection/docs/hooks/table";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsTablesLiveSelecting({ language }: TopicProps) {
	const table = useDocsTable();
	const tableName = table.schema.name;

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
-- Live query with diff mode
LIVE SELECT DIFF FROM ${tableName};

-- Live query with a WHERE clause and session parameters
LET $min_age = 18;
LIVE SELECT * FROM ${tableName} WHERE age > $min_age;
`,
			js: `
import { Table, gt } from 'surrealdb';

// Managed live query — automatically restarts on reconnect
const live = await db.live(new Table('${tableName}'))
	.diff()
	.where(gt('age', 18));

live.subscribe((action, result, record) => {
	switch (action) {
		case 'CREATE':
			console.log('New record:', result);
			break;
		case 'UPDATE':
			console.log('Updated:', record, result);
			break;
		case 'DELETE':
			console.log('Deleted:', record);
			break;
	}
});

// Stop the live query
await live.kill();
`,
			rust: `
// Create a live query via SurrealQL
let mut result = db.query("LIVE SELECT * FROM type::table($table)")
	.bind(("table", "${tableName}"))
	.await?;

let live_id = result.take::<Option<String>>(0)?;
`,
			py: `
# Create a live query via SurrealQL
result = await db.live('${tableName}')

# Process notifications
async for notification in result:
	print(notification)
`,
			go: `
import "github.com/surrealdb/surrealdb.go/pkg/models"

liveID, err := surrealdb.Live(ctx, db, models.Table("${tableName}"), false)
ch, _ := db.LiveNotifications(liveID.String())

for notification := range ch {
	// notification.Action: "CREATE", "UPDATE", "DELETE", or "CLOSE"
	fmt.Println(notification.Action, notification.Result)
}
`,
			csharp: `
var liveQuery = await db.LiveQuery<Person>($"LIVE SELECT * FROM type::table($table)",
	new Dictionary<string, object> { { "table", "${tableName}" } });

await foreach (var response in liveQuery)
{
	// CREATE, UPDATE, DELETE, or CLOSE
}
`,
			java: `
import com.surrealdb.LiveStream;
import com.surrealdb.LiveNotification;

try (LiveStream stream = db.selectLive("${tableName}")) {
	Optional<LiveNotification> notification = stream.next();
	notification.ifPresent(n ->
		System.out.println(n.getAction() + ": " + n.getValue())
	);
}
`,
		}),
		[tableName],
	);

	return (
		<Article
			title={
				<TableTitle
					title="Live queries"
					table={tableName}
				/>
			}
		>
			<Box component="p">
				Subscribe to real-time changes on <b>{tableName}</b>. Live queries require a
				WebSocket connection and stream CREATE, UPDATE, and DELETE events as they happen.
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Live queries"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
