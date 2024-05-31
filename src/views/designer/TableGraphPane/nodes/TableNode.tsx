import { iconTable } from "~/util/icons";
import { NodeData } from "../helpers";
import { BaseNode } from "./BaseNode";

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
