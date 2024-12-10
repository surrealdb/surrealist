import type { Node, NodeProps } from "@xyflow/react";
import { iconRelation } from "~/util/icons";
import type { SharedNodeData } from "../helpers";
import { BaseNode } from "./BaseNode";

export type EdgeNode = Node<SharedNodeData, "edge">;

export function EdgeNode({ data }: NodeProps<EdgeNode>) {
	return (
		<BaseNode
			icon={iconRelation}
			table={data.table}
			mode={data.mode}
			direction={data.direction}
			isSelected={data.isSelected}
			isEdge
		/>
	);
}
