import type { Node, NodeProps } from "@xyflow/react";
import type { SharedNodeData } from "../helpers";
import { BaseTableNode } from "./BaseTableNode";

export type ViewTableNode = Node<SharedNodeData, "view">;

export function ViewTableNode({ data }: NodeProps<ViewTableNode>) {
	return (
		<BaseTableNode
			table={data.table}
			mode={data.mode}
			direction={data.direction}
			isSelected={data.isSelected}
		/>
	);
}
