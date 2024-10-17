import type { Node, NodeProps } from "@xyflow/react";
import { iconTable } from "~/util/icons";
import type { SharedNodeData } from "../helpers";
import { BaseNode } from "./BaseNode";

export type TableNode = Node<SharedNodeData, "table">;

export function TableNode({ data }: NodeProps<TableNode>) {
	return (
		<BaseNode
			icon={iconTable}
			table={data.table}
			isSelected={data.isSelected}
			hasIncoming={data.hasIncoming}
			hasOutgoing={data.hasOutgoing}
		/>
	);
}
