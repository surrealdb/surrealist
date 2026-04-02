import type { Node, NodeProps } from "@xyflow/react";
import { memo } from "react";
import type { SharedNodeData } from "../helpers";
import { BaseTableNode } from "./BaseTableNode";

export type RelationTableNode = Node<SharedNodeData, "relation">;

export const RelationTableNode = memo(({ data }: NodeProps<RelationTableNode>) => {
	return (
		<BaseTableNode
			table={data.table}
			mode={data.mode}
			direction={data.direction}
			isSelected={data.isSelected}
			isEdge
		/>
	);
});
