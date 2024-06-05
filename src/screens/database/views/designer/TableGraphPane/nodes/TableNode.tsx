import { BaseNode } from "./BaseNode";
import { NodeData } from "../helpers";
import { iconTable } from "~/util/icons";

interface TableNodeProps {
	data: NodeData;
}

export function TableNode({ data }: TableNodeProps) {
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
