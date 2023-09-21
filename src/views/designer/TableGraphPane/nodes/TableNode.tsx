import { useIsLight } from "~/hooks/theme";
import { DesignerNodeMode, TableDefinition } from "~/types";
import { BaseNode } from "./BaseNode";
import { mdiTable } from "@mdi/js";

interface TableNodeProps {
	withoutGraph?: boolean;
	data: {
		table: TableDefinition;
		nodeMode: DesignerNodeMode;
		isSelected: boolean;
		hasLeftEdge: boolean;
		hasRightEdge: boolean;
		expanded: boolean;
		onExpand: (name: string) => void
	};
}

export function TableNode({ withoutGraph, data }: TableNodeProps) {
	const isLight = useIsLight();

	return (
		<BaseNode
			icon={mdiTable}
			isLight={isLight}
			table={data.table}
			isSelected={data.isSelected}
			nodeMode={data.nodeMode}
			hasLeftEdge={!withoutGraph && data.hasLeftEdge}
			hasRightEdge={!withoutGraph && data.hasRightEdge}
			withoutGraph={withoutGraph}
			expanded={data.expanded}
			onExpand={data.onExpand}
		/>
	);
}
