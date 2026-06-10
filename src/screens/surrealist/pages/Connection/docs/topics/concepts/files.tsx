import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Link } from "~/components/Link";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsConceptsFiles({ language }: TopicProps) {
	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
-- Define a bucket for file storage
DEFINE BUCKET my_bucket BACKEND "memory";

-- Store and retrieve file contents
f"my_bucket:/document.txt".put("Hello, SurrealDB!");
f"my_bucket:/document.txt".get();

-- Cast binary output to a string
<string>f"my_bucket:/document.txt".get();

-- Delete a file
f"my_bucket:/document.txt".delete();
`,
			js: `
await db.query(\`
	DEFINE BUCKET my_bucket BACKEND "memory";
	f"my_bucket:/document.txt".put("Hello, SurrealDB!");
\`);

const content = await db.query(
	'RETURN <string>f"my_bucket:/document.txt".get()',
);
`,
			rust: `
db.query(r#"
	DEFINE BUCKET my_bucket BACKEND "memory";
	f"my_bucket:/document.txt".put("Hello, SurrealDB!");
"#).await?;

let content: String = db
	.query(r#"RETURN <string>f"my_bucket:/document.txt".get()"#)
	.await?
	.take(0)?;
`,
			py: `
await db.query("""
	DEFINE BUCKET my_bucket BACKEND "memory";
	f"my_bucket:/document.txt".put("Hello, SurrealDB!");
""")

content = await db.query('RETURN <string>f"my_bucket:/document.txt".get()')
`,
			go: `
_, err := surrealdb.Query[any](ctx, db, \`
	DEFINE BUCKET my_bucket BACKEND "memory";
	f"my_bucket:/document.txt".put("Hello, SurrealDB!");
\`, nil)

content, err := surrealdb.Query[string](ctx, db,
	\`RETURN <string>f"my_bucket:/document.txt".get()\`, nil,
)
`,
			csharp: `
await db.RawQuery("""
	DEFINE BUCKET my_bucket BACKEND "memory";
	f"my_bucket:/document.txt".put("Hello, SurrealDB!");
""");

var content = await db.RawQuery(@"RETURN <string>f""my_bucket:/document.txt"".get()");
`,
			java: `
db.query("""
	DEFINE BUCKET my_bucket BACKEND "memory";
	f"my_bucket:/document.txt".put("Hello, SurrealDB!");
""");

String content = db.query(
	"RETURN <string>f\"my_bucket:/document.txt\".get()"
).take(String.class, 0);
`,
			php: `
$db->query('
	DEFINE BUCKET my_bucket BACKEND "memory";
	f"my_bucket:/document.txt".put("Hello, SurrealDB!");
');

$content = $db->query('RETURN <string>f"my_bucket:/document.txt".get()');
`,
		}),
		[],
	);

	return (
		<Article title="Working with files">
			<Box>
				<Box component="p">
					File values are prefixed with <code>f</code> and stored in buckets defined with{" "}
					<code>DEFINE BUCKET</code>. Use <code>.put()</code>, <code>.get()</code>, and{" "}
					<code>.delete()</code> on file pointers to manage binary content. See the{" "}
					<Link href="https://surrealdb.com/docs/learn/schema-management/files/working-with-files">
						files guide
					</Link>{" "}
					for bucket backends and permissions.
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="File storage"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
