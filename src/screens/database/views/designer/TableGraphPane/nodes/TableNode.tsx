import { iconTable } from "~/util/icons";
import type { NodeData } from "../helpers";
import { BaseNode } from "./BaseNode";
import type { NodeProps } from "reactflow";

export function TableNode({ id, data }: NodeProps<NodeData>) {
	return (
		<BaseNode
			id={id}
			icon={iconTable}
			table={data.table}
			isSelected={data.isSelected}
			hasIncoming={data.hasIncoming}
			hasOutgoing={data.hasOutgoing}
		/>
	);
}
