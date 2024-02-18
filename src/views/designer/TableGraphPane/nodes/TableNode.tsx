import { BaseNode } from "./BaseNode";
import { mdiTable } from "@mdi/js";
import { NodeData } from "../helpers";

interface TableNodeProps {
	withoutGraph?: boolean;
	data: NodeData;
}

export function TableNode({ withoutGraph, data }: TableNodeProps) {
	return (
		<BaseNode
			icon={mdiTable}
			table={data.table}
			isSelected={data.isSelected}
			hasLeftEdge={!withoutGraph && data.hasLeftEdge}
			hasRightEdge={!withoutGraph && data.hasRightEdge}
			withoutGraph={withoutGraph}
		/>
	);
}
