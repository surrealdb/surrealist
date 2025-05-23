import type { Node, NodeProps } from "@xyflow/react";
import type { SharedNodeData } from "../helpers";
import { BaseTableNode } from "./BaseTableNode";

export type NormalTableNode = Node<SharedNodeData, "normal">;

export function NormalTableNode({ data }: NodeProps<NormalTableNode>) {
	return (
		<BaseTableNode
			table={data.table}
			mode={data.mode}
			direction={data.direction}
			isSelected={data.isSelected}
		/>
	);
}
