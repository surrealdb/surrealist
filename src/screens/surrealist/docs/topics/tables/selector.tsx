import { Alert, Group, Select, Text } from "@mantine/core";
import { Icon } from "@surrealdb/ui";
import { useMemo } from "react";
import { useTableNames } from "~/hooks/schema";
import { useInterfaceStore } from "~/stores/interface";
import { iconWarning } from "~/util/icons";
import { Article } from "../../components";

export function DocsTablesSelector() {
	const { setDocsTable } = useInterfaceStore.getState();

	const tables = useTableNames();

	const options = useMemo(() => {
		return tables.map((table) => ({ value: table, label: table }));
	}, [tables]);

	const activeTable = useInterfaceStore((state) => state.docsTable);

	return (
		<Article>
			<Alert
				mt="xl"
				color="blue"
				title="Preview a table"
			>
				Select a table to preview it in the following table topics
				{tables.length === 0 ? (
					<Group
						mt="sm"
						opacity={0.75}
						gap="xs"
					>
						<Icon
							path={iconWarning}
							size="sm"
						/>
						<Text>The current schema has no tables defined</Text>
					</Group>
				) : (
					<Select
						mt="md"
						data={options}
						placeholder="example_table"
						value={activeTable}
						onChange={setDocsTable as any}
						clearable
						maw={325}
					/>
				)}
			</Alert>
		</Article>
	);
}
