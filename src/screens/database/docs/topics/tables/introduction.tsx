import { Alert, Box, Group, Select, Text, TextInput } from "@mantine/core";
import { useMemo } from "react";
import { Icon } from "~/components/Icon";
import { useTableNames } from "~/hooks/schema";
import { Article, DocsPreview } from "~/screens/database/docs/components";
import type { Snippets, TopicProps } from "~/screens/database/docs/types";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { iconWarning } from "~/util/icons";

export function DocsTablesIntroduction({ language }: TopicProps) {
	const { setDocsTable } = useInterfaceStore.getState();

	const tables = useTableNames();

	const options = useMemo(() => {
		return tables.map((table) => ({ value: table, label: table }));
	}, [tables]);

	const activeTable = useInterfaceStore((state) => state.docsTable);

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `

		-- Create schemafull user table.
		DEFINE TABLE ${activeTable} SCHEMAFULL;
		`,
			js: `
		db.create('${activeTable}');
		`,
			rust: `
		db.create("${activeTable}").await?;
		`,
			py: `
		db.create('${activeTable}')
		`,
			go: `
		db.Create("${activeTable}", map[string]interface{}{})
		`,
			csharp: `
		await db.Create<TableName>("${activeTable}");
		`,
			java: `
		// Connect to a local endpoint
		SurrealWebSocketConnection.connect(timeout)
		`,
			php: `
		$db->create("${activeTable}");
		`,
		}),
		[activeTable],
	);

	return (
		<Article title="Tables">
			<div>
				<p>
					Tables are the primary data structure in a database. They store data in the form
					of records, and can be further configured with indexes and events.
				</p>
			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Tables"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
