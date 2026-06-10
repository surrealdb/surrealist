import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import { useDocsConnection } from "~/screens/surrealist/pages/Connection/docs/hooks/connection";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsSdkImportExport({ language }: TopicProps) {
	const { esc_endpoint, esc_namespace, esc_database } = useDocsConnection();

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
surreal export \\
	--endpoint ${esc_endpoint} \\
	--namespace ${esc_namespace} \\
	--database ${esc_database} \\
	--user root --pass secret \\
	backup.surql

surreal import \\
	--endpoint ${esc_endpoint} \\
	--namespace ${esc_namespace} \\
	--database ${esc_database} \\
	--user root --pass secret \\
	backup.surql
`,
			js: `
const sql = await db.export({ records: true });
await db.import(sql);
`,
			rust: `
// Requires HTTP connection (protocol-http feature)
db.export("backup.surql").await?;
db.import("backup.surql").await?;
`,
			py: `
# Use the CLI for import/export
# surreal export --endpoint ... backup.surql
`,
			go: `
// Use the CLI for import/export
// surreal export --endpoint ... backup.surql
`,
			java: `
db.exportSql("backup.surql");
db.importSql("backup.surql");
`,
			csharp: `
var sql = await db.Export(new ExportOptions { Records = true });
await db.Import(sql);
`,
			php: `
$sql = file_get_contents("backup.surql");
$db->import($sql, "root", "secret");
`,
		}),
		[esc_endpoint, esc_namespace, esc_database],
	);

	return (
		<Article title="Import and export">
			<Box>
				<Box component="p">
					Export a database to a SurrealQL file and import it into another instance. The
					CLI is the most portable option; some SDKs provide native methods. Rust
					import/export requires an HTTP connection.
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Import and export"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
