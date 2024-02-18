import { mdiVectorLine } from "@mdi/js";
import { BaseNode } from "./BaseNode";
import { NodeData } from "../helpers";

interface EdgeNodeProps {
	withoutGraph?: boolean;
	data: NodeData;
}

export function EdgeNode({ data, withoutGraph }: EdgeNodeProps) {
	return (
		<BaseNode
			icon={mdiVectorLine}
			table={data.table}
			isSelected={data.isSelected}
			hasLeftEdge={!withoutGraph}
			hasRightEdge={!withoutGraph}
			withoutGraph={withoutGraph}
		/>
	);
}
