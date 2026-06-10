import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsConceptsGraphTraversal({ language }: TopicProps) {
	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
-- Forward traversal: find posts written by a user
SELECT ->wrote->post.* AS posts FROM user:alice;

-- Reverse traversal: find authors of a post
SELECT <-wrote<-user.* AS authors FROM post:hello;

-- Chain multiple hops
SELECT <-wrote<-user->wrote->comment.* FROM comment:one;

-- Bidirectional traversal on symmetric relations
SELECT <->friends_with<->person AS friends FROM person:one;
`,
			js: `
// Traverse a graph using SurrealQL arrow syntax
const posts = await db.query(
	'SELECT ->wrote->post.* AS posts FROM user:alice',
);

const authors = await db.query(
	'SELECT <-wrote<-user.* AS authors FROM type::record($post)',
	{ post: 'post:hello' },
);

// Traverse directly from a record ID
const writer = await db.query('RETURN comment:one<-wrote<-user');
`,
			rust: `
let posts: Vec<Post> = db
	.query("SELECT ->wrote->post.* AS posts FROM user:alice")
	.await?
	.take(0)?;

let authors: Vec<User> = db
	.query("SELECT <-wrote<-user.* AS authors FROM type::record($post)")
	.bind(("post", "post:hello"))
	.await?
	.take(0)?;
`,
			py: `
posts = await db.query(
	"SELECT ->wrote->post.* AS posts FROM user:alice"
)

authors = await db.query(
	"SELECT <-wrote<-user.* AS authors FROM type::record($post)",
	{"post": "post:hello"},
)
`,
			go: `
posts, err := surrealdb.Query[[]Post](ctx, db,
	"SELECT ->wrote->post.* AS posts FROM user:alice", nil,
)

authors, err := surrealdb.Query[[]User](ctx, db,
	"SELECT <-wrote<-user.* AS authors FROM type::record($post)",
	map[string]any{"post": "post:hello"},
)
`,
			csharp: `
var posts = await db.RawQuery("SELECT ->wrote->post.* AS posts FROM user:alice");

var authors = await db.RawQuery(
	"SELECT <-wrote<-user.* AS authors FROM type::record($post)",
	new Dictionary<string, object?> { { "post", "post:hello" } },
);
`,
			java: `
List<Post> posts = db.query(
	"SELECT ->wrote->post.* AS posts FROM user:alice"
).take(Post.class, 0);

List<User> authors = db.queryBind(
	"SELECT <-wrote<-user.* AS authors FROM type::record($post)",
	Map.of("post", "post:hello")
).take(User.class, 0);
`,
			php: `
$posts = $db->query("SELECT ->wrote->post.* AS posts FROM user:alice");

$authors = $db->query(
	"SELECT <-wrote<-user.* AS authors FROM type::record($post)",
	["post" => "post:hello"],
);
`,
		}),
		[],
	);

	return (
		<Article title="Graph traversal">
			<Box>
				<Box component="p">
					Graph queries use SurrealQL arrow syntax to walk relationships between records.
					Use <code>-&gt;</code> for forward traversal, <code>&lt;-</code> for reverse,
					and <code>&lt;-&gt;</code> for bidirectional edges on symmetric relations.
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Graph traversal"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
