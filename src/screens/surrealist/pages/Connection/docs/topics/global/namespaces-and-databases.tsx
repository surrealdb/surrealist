import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import { useDocsConnection } from "~/screens/surrealist/pages/Connection/docs/hooks/connection";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsGlobalNamespacesAndDatabases({ language }: TopicProps) {
	const { esc_endpoint, esc_namespace, esc_database } = useDocsConnection();

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
# New instances default to namespace 'main' and database 'main'
surreal sql --endpoint ${esc_endpoint} --user root --pass secret

# Explicitly select a namespace and database
USE NS ${esc_namespace};
USE DB ${esc_database};

# Configure instance defaults
DEFINE CONFIG DEFAULT
	NAMESPACE main
	DATABASE main;
`,
			js: `
// Pass namespace and database when connecting
await db.connect(${esc_endpoint}, {
	namespace: ${esc_namespace},
	database: ${esc_database},
});

// Or switch after connecting
await db.use({
	namespace: ${esc_namespace},
	database: ${esc_database},
});
`,
			rust: `
db.use_ns(${esc_namespace}).use_db(${esc_database}).await?;

// Use server-configured defaults
db.use_defaults().await?;
`,
			py: `
await db.use(${esc_namespace}, ${esc_database})
`,
			go: `
err := db.Use(ctx, ${esc_namespace}, ${esc_database})
`,
			csharp: `
await db.Use(${esc_namespace}, ${esc_database});
`,
			java: `
db.useNs(${esc_namespace}).useDb(${esc_database});

// Use server-configured defaults
db.useDefaults();
`,
			php: `
$db->use([
	"namespace" => ${esc_namespace},
	"database" => ${esc_database},
]);
`,
		}),
		[esc_endpoint, esc_namespace, esc_database],
	);

	return (
		<Article title="Namespaces and databases">
			<Box>
				<Box component="p">
					Namespaces group related databases, users, and access methods. Databases within
					a namespace hold your tables, indexes, and functions. When you start a new
					SurrealDB instance, it automatically creates a default namespace and database
					both named <code>main</code>.
				</Box>
				<Box
					component="p"
					mt="md"
				>
					Clients can omit an explicit selection and use these defaults, or call{" "}
					<code>USE NS</code> / <code>USE DB</code> (CLI) or <code>.use()</code> (SDKs) to
					switch context. Configure instance-wide defaults with{" "}
					<code>DEFINE CONFIG DEFAULT NAMESPACE … DATABASE …</code>.
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Namespaces and databases"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
