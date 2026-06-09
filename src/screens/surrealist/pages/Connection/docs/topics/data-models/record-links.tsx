import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsDataModelsRecordLinks({ language }: TopicProps) {
	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
-- Append a record link to an array field
UPDATE user:alice SET comments += comment:one;

-- Fetch linked records with subquery syntax
SELECT name, comments.{ created_at, text } FROM user;

-- Bidirectional reference tracking
DEFINE FIELD comics ON person TYPE array<record<comic_book>> REFERENCE;
SELECT <~comics FROM comic_book:one;
`,
			js: `
import { RecordId } from 'surrealdb';

await db.query(\`
	UPDATE user:alice SET comments += comment:one;
\`);

const users = await db.query(
	'SELECT name, comments.{ created_at, text } FROM user',
);
`,
			rust: `
db.query("UPDATE user:alice SET comments += comment:one").await?;

let users: Vec<User> = db
	.query("SELECT name, comments.{ created_at, text } FROM user")
	.await?
	.take(0)?;
`,
			py: `
await db.query("UPDATE user:alice SET comments += comment:one")

users = await db.query("SELECT name, comments.{ created_at, text } FROM user")
`,
			go: `
_, err := surrealdb.Query[any](ctx, db,
	"UPDATE user:alice SET comments += comment:one", nil,
)
`,
			java: `
db.query("UPDATE user:alice SET comments += comment:one");
db.query("SELECT name, comments.{ created_at, text } FROM user");
`,
			csharp: `
await db.RawQuery("UPDATE user:alice SET comments += comment:one");
await db.RawQuery("SELECT name, comments.{ created_at, text } FROM user");
`,
			php: `
$db->query("UPDATE user:alice SET comments += comment:one");
$db->query("SELECT name, comments.{ created_at, text } FROM user");
`,
		}),
		[],
	);

	return (
		<Article title="Record links">
			<Box>
				<Box component="p">
					Record links are lightweight <code>record&lt;table&gt;</code> pointers stored in
					fields — simpler than graph edges when you do not need edge properties. Use{" "}
					<code>REFERENCE</code> for bidirectional tracking and <code>&lt;~</code> to
					traverse inbound links.
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Record links"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
