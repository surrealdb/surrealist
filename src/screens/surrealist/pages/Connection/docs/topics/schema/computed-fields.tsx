import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsSchemaComputedFields({ language }: TopicProps) {
	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
-- Computed fields are evaluated on read
DEFINE FIELD accessed_at ON TABLE user COMPUTED time::now();
DEFINE FIELD duration ON activity COMPUTED end - start;

-- Closures for reusable expressions
LET $double = |$n: number| $n * 2;
RETURN $double(21);
`,
			js: `
await db.query(\`
	DEFINE FIELD accessed_at ON TABLE user COMPUTED time::now();
	DEFINE FIELD duration ON activity COMPUTED end - start;
\`);
`,
			rust: `
db.query(r#"
	DEFINE FIELD accessed_at ON TABLE user COMPUTED time::now();
	DEFINE FIELD duration ON activity COMPUTED end - start;
"#).await?;
`,
			py: `
await db.query("""
	DEFINE FIELD accessed_at ON TABLE user COMPUTED time::now();
	DEFINE FIELD duration ON activity COMPUTED end - start;
""")
`,
			go: `
_, err := surrealdb.Query[any](ctx, db, \`
	DEFINE FIELD accessed_at ON TABLE user COMPUTED time::now();
	DEFINE FIELD duration ON activity COMPUTED end - start;
\`, nil)
`,
			java: `
db.query("""
	DEFINE FIELD accessed_at ON TABLE user COMPUTED time::now();
	DEFINE FIELD duration ON activity COMPUTED end - start;
""");
`,
			csharp: `
await db.RawQuery("""
	DEFINE FIELD accessed_at ON TABLE user COMPUTED time::now();
	DEFINE FIELD duration ON activity COMPUTED end - start;
""");
`,
			php: `
$db->query('
	DEFINE FIELD accessed_at ON TABLE user COMPUTED time::now();
	DEFINE FIELD duration ON activity COMPUTED end - start;
');
`,
		}),
		[],
	);

	return (
		<Article title="Computed fields">
			<Box>
				<Box component="p">
					Computed fields are evaluated when records are read, not stored on disk. Define
					them with <code>COMPUTED</code> in a <code>DEFINE FIELD</code> statement.
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Computed fields"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
