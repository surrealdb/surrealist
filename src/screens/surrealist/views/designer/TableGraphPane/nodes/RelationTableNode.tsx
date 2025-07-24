import type { Node, NodeProps } from "@xyflow/react";
import type { SharedNodeData } from "../helpers";
import { BaseTableNode } from "./BaseTableNode";

export type RelationTableNode = Node<SharedNodeData, "relation">;

export function RelationTableNode({ data }: NodeProps<RelationTableNode>) {
	return (
		<BaseTableNode
			table={data.table}
			mode={data.mode}
			direction={data.direction}
			isSelected={data.isSelected}
			isEdge
		/>
	);
}
