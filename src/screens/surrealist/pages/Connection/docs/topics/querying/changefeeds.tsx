import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsQueryingChangefeeds({ language }: TopicProps) {
	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
-- Enable changefeed on a table (retain 3 days of history)
DEFINE TABLE reading CHANGEFEED 3d;

-- Replay changes since a timestamp
SHOW CHANGES FOR TABLE reading SINCE d"2025-09-07T01:23:52Z" LIMIT 10;

-- Replay changes since a version offset
SHOW CHANGES FOR TABLE reading SINCE 1 LIMIT 10;
`,
			js: `
await db.query(\`
	DEFINE TABLE reading CHANGEFEED 3d;
\`);

const changes = await db.query(
	'SHOW CHANGES FOR TABLE reading SINCE $since LIMIT 10',
	{ since: '2025-09-07T01:23:52Z' },
);
`,
			rust: `
db.query("DEFINE TABLE reading CHANGEFEED 3d").await?;

let changes = db
	.query("SHOW CHANGES FOR TABLE reading SINCE $since LIMIT 10")
	.bind(("since", "2025-09-07T01:23:52Z"))
	.await?;
`,
			py: `
await db.query("DEFINE TABLE reading CHANGEFEED 3d")

changes = await db.query(
	"SHOW CHANGES FOR TABLE reading SINCE $since LIMIT 10",
	{"since": "2025-09-07T01:23:52Z"},
)
`,
			go: `
_, err := surrealdb.Query[any](ctx, db, "DEFINE TABLE reading CHANGEFEED 3d", nil)

changes, err := surrealdb.Query[any](ctx, db,
	"SHOW CHANGES FOR TABLE reading SINCE $since LIMIT 10",
	map[string]any{"since": "2025-09-07T01:23:52Z"},
)
`,
			java: `
db.query("DEFINE TABLE reading CHANGEFEED 3d");

db.queryBind(
	"SHOW CHANGES FOR TABLE reading SINCE $since LIMIT 10",
	Map.of("since", "2025-09-07T01:23:52Z")
);
`,
			csharp: `
await db.RawQuery("DEFINE TABLE reading CHANGEFEED 3d");

await db.RawQuery(
	"SHOW CHANGES FOR TABLE reading SINCE $since LIMIT 10",
	new Dictionary<string, object?> { { "since", "2025-09-07T01:23:52Z" } }
);
`,
			php: `
$db->query('DEFINE TABLE reading CHANGEFEED 3d');

$db->query(
	'SHOW CHANGES FOR TABLE reading SINCE $since LIMIT 10',
	["since" => "2025-09-07T01:23:52Z"]
);
`,
		}),
		[],
	);

	return (
		<Article title="Changefeeds">
			<Box>
				<Box component="p">
					Changefeeds retain a history of table writes so you can replay changes with{" "}
					<code>SHOW CHANGES</code>. Unlike live queries, changefeeds store past mutations
					for sync pipelines and audit trails.
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Changefeeds"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
