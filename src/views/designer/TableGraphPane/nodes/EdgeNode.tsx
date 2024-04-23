import { BaseNode } from "./BaseNode";
import { NodeData } from "../helpers";
import { iconRelation } from "~/util/icons";

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
		/>
	);
}
