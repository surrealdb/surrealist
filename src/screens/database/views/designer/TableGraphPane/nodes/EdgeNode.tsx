import { iconRelation } from "~/util/icons";
import type { NodeData } from "../helpers";
import { BaseNode } from "./BaseNode";
import type { NodeProps } from "reactflow";

export function EdgeNode({ id, data }: NodeProps<NodeData>) {
	return (
		<BaseNode
			id={id}
			icon={iconRelation}
			table={data.table}
			isSelected={data.isSelected}
			hasIncoming
			hasOutgoing
			isEdge
		/>
	);
}
