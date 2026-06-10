import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsSchemaFunctions({ language }: TopicProps) {
	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
-- Custom functions are prefixed with fn::
DEFINE FUNCTION fn::greet($name: string) {
	RETURN "Hello, " + $name + "!";
};

RETURN fn::greet("Tobie");
`,
			js: `
await db.query(\`
	DEFINE FUNCTION fn::greet($name: string) {
		RETURN "Hello, " + $name + "!";
	};
\`);

const result = await db.query('RETURN fn::greet($name)', { name: 'Tobie' });
`,
			rust: `
db.query(r#"
	DEFINE FUNCTION fn::greet($name: string) {
		RETURN "Hello, " + $name + "!";
	};
"#).await?;

let greeting: String = db
	.query("RETURN fn::greet($name)")
	.bind(("name", "Tobie"))
	.await?
	.take(0)?;
`,
			py: `
await db.query("""
	DEFINE FUNCTION fn::greet($name: string) {
		RETURN "Hello, " + $name + "!";
	};
""")

result = await db.query("RETURN fn::greet($name)", {"name": "Tobie"})
`,
			go: `
_, err := surrealdb.Query[any](ctx, db, \`
	DEFINE FUNCTION fn::greet($name: string) {
		RETURN "Hello, " + $name + "!";
	};
\`, nil)

greeting, err := surrealdb.Query[string](ctx, db,
	"RETURN fn::greet($name)",
	map[string]any{"name": "Tobie"},
)
`,
			csharp: `
await db.RawQuery("""
	DEFINE FUNCTION fn::greet($name: string) {
		RETURN "Hello, " + $name + "!";
	};
""");

var result = await db.RawQuery(
	"RETURN fn::greet($name)",
	new Dictionary<string, object?> { { "name", "Tobie" } },
);
`,
			java: `
db.query("""
	DEFINE FUNCTION fn::greet($name: string) {
		RETURN "Hello, " + $name + "!";
	};
""");

Response response = db.queryBind(
	"RETURN fn::greet($name)",
	Map.of("name", "Tobie")
);
`,
			php: `
$db->query('
	DEFINE FUNCTION fn::greet($name: string) {
		RETURN "Hello, " + $name + "!";
	};
');

$result = $db->query("RETURN fn::greet($name)", ["name" => "Tobie"]);
`,
		}),
		[],
	);

	return (
		<Article title="Functions">
			<Box>
				<Box component="p">
					Custom functions encapsulate reusable logic in your database schema. Prefix
					function names with <code>fn::</code> and call them from SurrealQL queries or
					other functions.
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Define a function"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
