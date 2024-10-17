import { iconRelation } from "~/util/icons";
import { BaseNode } from "./BaseNode";
import type { Node, NodeProps } from "@xyflow/react";
import type { SharedNodeData } from "../helpers";

export type EdgeNode = Node<SharedNodeData, "edge">;

export function EdgeNode({ data }: NodeProps<EdgeNode>) {
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
