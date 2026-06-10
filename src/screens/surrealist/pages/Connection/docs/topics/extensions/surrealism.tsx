import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Link } from "~/components/Link";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsExtensionsSurrealism({ language }: TopicProps) {
	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
# Start with Surrealism experimental flag enabled
surreal start --allow-experimental surrealism memory

# Scaffold and build a module
surreal module init my_module
surreal module build
surreal module info demo.surli
`,
			js: `
await db.query(\`
	DEFINE BUCKET modules BACKEND "file:/path/to/modules";
	DEFINE MODULE mod::demo AS f"modules:/demo.surli";
	RETURN mod::demo::can_drive(21);
\`);
`,
			rust: `
// Authoring (compile to .surli)
#[surrealism]
fn can_drive(age: i64) -> bool {
	age >= 18
}

// Calling from SurrealQL via any SDK
db.query(r#"
	DEFINE BUCKET modules BACKEND "file:/path/to/modules";
	DEFINE MODULE mod::demo AS f"modules:/demo.surli";
	RETURN mod::demo::can_drive($age);
"#)
.bind(("age", 21))
.await?;
`,
			py: `
await db.query("""
	DEFINE BUCKET modules BACKEND "file:/path/to/modules";
	DEFINE MODULE mod::demo AS f"modules:/demo.surli";
	RETURN mod::demo::can_drive($age);
""", {"age": 21})
`,
			go: `
_, err := surrealdb.Query[any](ctx, db, \`
	DEFINE BUCKET modules BACKEND "file:/path/to/modules";
	DEFINE MODULE mod::demo AS f"modules:/demo.surli";
	RETURN mod::demo::can_drive($age);
\`, map[string]any{"age": 21})
`,
			java: `
db.query("""
	DEFINE BUCKET modules BACKEND "file:/path/to/modules";
	DEFINE MODULE mod::demo AS f"modules:/demo.surli";
	RETURN mod::demo::can_drive($age);
""");
`,
			csharp: `
await db.RawQuery("""
	DEFINE BUCKET modules BACKEND "file:/path/to/modules";
	DEFINE MODULE mod::demo AS f"modules:/demo.surli";
	RETURN mod::demo::can_drive($age);
""", new Dictionary<string, object?> { { "age", 21 } });
`,
			php: `
$db->query('
	DEFINE BUCKET modules BACKEND "file:/path/to/modules";
	DEFINE MODULE mod::demo AS f"modules:/demo.surli";
	RETURN mod::demo::can_drive($age);
', ["age" => 21]);
`,
		}),
		[],
	);

	return (
		<Article title="Surrealism extensions">
			<Box>
				<Box component="p">
					Surrealism lets you compile Rust functions into <code>.surli</code> WASM modules
					and call them from SurrealQL. Annotate functions with <code>#[surrealism]</code>
					, build with <code>surreal module build</code>, then register via{" "}
					<code>DEFINE BUCKET</code> and <code>DEFINE MODULE</code>. Requires{" "}
					<code>--allow-experimental surrealism</code> on the server.{" "}
					<Link href="https://surrealdb.com/docs/learn/extensions/plugins/overview">
						Learn more
					</Link>
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Surrealism extensions"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
