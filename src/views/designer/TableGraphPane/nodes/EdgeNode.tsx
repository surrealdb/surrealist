import { BaseNode } from "./BaseNode";
import { NodeData } from "../helpers";
import { iconRelation } from "~/util/icons";

interface EdgeNodeProps {
	withoutGraph?: boolean;
	data: NodeData;
}

export function EdgeNode({ data, withoutGraph }: EdgeNodeProps) {
	return (
		<BaseNode
			icon={iconRelation}
			table={data.table}
			isSelected={data.isSelected}
			hasLeftEdge={!withoutGraph}
			hasRightEdge={!withoutGraph}
			withoutGraph={withoutGraph}
		/>
	);
}
