import { BaseNode } from "./BaseNode";
import { NodeData } from "../helpers";
import { iconTable } from "~/util/icons";

interface TableNodeProps {
	withoutGraph?: boolean;
	data: NodeData;
}

export function TableNode({ withoutGraph, data }: TableNodeProps) {
	return (
		<BaseNode
			icon={iconTable}
			table={data.table}
			isSelected={data.isSelected}
			hasLeftEdge={!withoutGraph && data.hasLeftEdge}
			hasRightEdge={!withoutGraph && data.hasRightEdge}
			withoutGraph={withoutGraph}
		/>
	);
}
