import { iconRelation } from "~/util/icons";
import type { NodeData } from "../helpers";
import { BaseNode } from "./BaseNode";

interface EdgeNodeProps {
	data: NodeData;
}

export function EdgeNode({ data }: EdgeNodeProps) {
	return (
		<BaseNode
			icon={iconRelation}
			table={data.table}
			isSelected={data.isSelected}
			hasIncoming
			hasOutgoing
			isEdge
		/>
	);
}
