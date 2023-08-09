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
			<div ref={ref} />
		</Panel>
	);
}