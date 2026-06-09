import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsAuthAccessUserData({ language }: TopicProps) {
	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
-- Access the authenticated record user in SurrealQL
RETURN $auth;

-- Use $auth in queries to scope data to the current user
SELECT * FROM post WHERE author = $auth.id;
`,
			js: `
// Get connection and authentication info
const info = await db.info();

// Use $auth in SurrealQL queries
const posts = await db.query(
	'SELECT * FROM post WHERE author = $auth.id',
);
`,
			rust: `
let info = db.info().await?;

let posts: Vec<Post> = db
	.query("SELECT * FROM post WHERE author = $auth.id")
	.await?
	.take(0)?;
`,
			py: `
info = await db.info()

posts = await db.query("SELECT * FROM post WHERE author = $auth.id")
`,
			go: `
info, err := db.Info(ctx)

posts, err := surrealdb.Query[[]Post](ctx, db,
	"SELECT * FROM post WHERE author = $auth.id", nil,
)
`,
			csharp: `
var info = await db.Info<User>();

var posts = await db.RawQuery("SELECT * FROM post WHERE author = $auth.id");
`,
			java: `
// Access the authenticated record user in SurrealQL
Response auth = db.query("RETURN $auth");

// Scope queries to the current user
List<Post> posts = db.queryBind(
	"SELECT * FROM post WHERE author = $auth.id",
	Map.of()
).take(Post.class, 0);
`,
			php: `
$info = $db->info();

$posts = $db->query("SELECT * FROM post WHERE author = $auth.id");
`,
		}),
		[],
	);

	return (
		<Article title="Access user data">
			<Box>
				<Box component="p">
					When authenticated via a record access method, use <code>$auth</code> in
					SurrealQL to reference the current user&apos;s record. Call <code>info()</code>{" "}
					in SDKs to retrieve connection and authentication metadata.
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Access user data"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
