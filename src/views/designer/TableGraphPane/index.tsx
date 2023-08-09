import { ActionIcon, Button, Group, Stack } from "@mantine/core";
import { mdiAdjust, mdiDownload, mdiPlus, mdiRefresh } from "@mdi/js";
import { ElementRef, useEffect, useRef } from "react";
import { Icon } from "~/components/Icon";
import { Panel } from "~/components/Panel";
import { TableDefinition } from "~/types";
import { fetchDatabaseSchema } from "~/util/schema";

export interface TableGraphPaneProps {
	tables: TableDefinition[];
	setActiveTable: (table: string) => void;
}

export function TableGraphPane(props: TableGraphPaneProps) {
	const ref = useRef<ElementRef<'div'>>(null);

	useEffect(() => {
		// TODO graph stuff
	}, []);

	return (
		<Panel
			title="Table Graph"
			icon={mdiAdjust}
			rightSection={
				<Group noWrap>
					<ActionIcon
						title="Refresh"
					>
						<Icon color="light.4" path={mdiDownload} />
					</ActionIcon>
					<ActionIcon
						title="Refresh"
						onClick={fetchDatabaseSchema}
					>
						<Icon color="light.4" path={mdiRefresh} />
					</ActionIcon>
					<ActionIcon
						title="Create"
					>
						<Icon color="light.4" path={mdiPlus} />
					</ActionIcon>
				</Group>
			}
		>
			<Stack maw={280} mah="calc(100vh - 500px)" style={{ overflowY: 'scroll' }}>
				{props.tables.map(table => (
					<Button
						key={table.schema.name}
						onClick={() => props.setActiveTable(table.schema.name)}
						py="xs"
					>
						{table.schema.name}
					</Button>
				))}
			</Stack>
		</Panel>
	);
}