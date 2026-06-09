import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsSchemaUsers({ language }: TopicProps) {
	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
-- Create a root user
DEFINE USER admin ON ROOT PASSWORD 'secret' ROLES OWNER;

-- Create a namespace user
DEFINE USER editor ON NAMESPACE PASSWORD 'secret' ROLES EDITOR;

-- Create a database user
DEFINE USER viewer ON DATABASE PASSWORD 'secret' ROLES VIEWER;
`,
			js: `
await db.query(\`
	DEFINE USER admin ON ROOT PASSWORD 'secret' ROLES OWNER;
	DEFINE USER editor ON NAMESPACE PASSWORD 'secret' ROLES EDITOR;
	DEFINE USER viewer ON DATABASE PASSWORD 'secret' ROLES VIEWER;
\`);
`,
			rust: `
db.query(r#"
	DEFINE USER admin ON ROOT PASSWORD 'secret' ROLES OWNER;
	DEFINE USER editor ON NAMESPACE PASSWORD 'secret' ROLES EDITOR;
	DEFINE USER viewer ON DATABASE PASSWORD 'secret' ROLES VIEWER;
"#).await?;
`,
			py: `
await db.query("""
	DEFINE USER admin ON ROOT PASSWORD 'secret' ROLES OWNER;
	DEFINE USER editor ON NAMESPACE PASSWORD 'secret' ROLES EDITOR;
	DEFINE USER viewer ON DATABASE PASSWORD 'secret' ROLES VIEWER;
""")
`,
			go: `
_, err := surrealdb.Query[any](ctx, db, \`
	DEFINE USER admin ON ROOT PASSWORD 'secret' ROLES OWNER;
	DEFINE USER editor ON NAMESPACE PASSWORD 'secret' ROLES EDITOR;
	DEFINE USER viewer ON DATABASE PASSWORD 'secret' ROLES VIEWER;
\`, nil)
`,
			csharp: `
await db.RawQuery("""
	DEFINE USER admin ON ROOT PASSWORD 'secret' ROLES OWNER;
	DEFINE USER editor ON NAMESPACE PASSWORD 'secret' ROLES EDITOR;
	DEFINE USER viewer ON DATABASE PASSWORD 'secret' ROLES VIEWER;
""");
`,
			java: `
db.query("""
	DEFINE USER admin ON ROOT PASSWORD 'secret' ROLES OWNER;
	DEFINE USER editor ON NAMESPACE PASSWORD 'secret' ROLES EDITOR;
	DEFINE USER viewer ON DATABASE PASSWORD 'secret' ROLES VIEWER;
""");
`,
			php: `
$db->query('
	DEFINE USER admin ON ROOT PASSWORD "secret" ROLES OWNER;
	DEFINE USER editor ON NAMESPACE PASSWORD "secret" ROLES EDITOR;
	DEFINE USER viewer ON DATABASE PASSWORD "secret" ROLES VIEWER;
');
`,
		}),
		[],
	);

	return (
		<Article title="System users">
			<Box>
				<Box component="p">
					System users authenticate at the root, namespace, or database level. Assign
					roles — <code>OWNER</code>, <code>EDITOR</code>, or <code>VIEWER</code> — to
					control what each user can do within the scope they are defined on.
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Define system users"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
