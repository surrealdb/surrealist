import { Button, Stack } from "@mantine/core";
import { mdiAdjust } from "@mdi/js";
import { ElementRef, useEffect, useRef } from "react";
import { Panel } from "~/components/Panel";
import { TableDefinition } from "~/types";

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