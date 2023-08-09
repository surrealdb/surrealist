import { mdiAdjust } from "@mdi/js";
import { ElementRef, useEffect, useRef } from "react";
import { Panel } from "~/components/Panel";
import { TableDefinition } from "~/types";

export interface VisualizerPaneProps {
	tables: TableDefinition[];
	setActiveTable: (table: string) => void;
}

export function VisualizerPane(props: VisualizerPaneProps) {
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