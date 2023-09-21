import { mdiVectorLine } from "@mdi/js";
import { useIsLight } from "~/hooks/theme";
import { DesignerNodeMode, TableDefinition } from "~/types";
import { BaseNode } from "./BaseNode";

interface EdgeNodeProps {
	withoutGraph?: boolean;
	data: {
		table: TableDefinition;
		isSelected: boolean;
		nodeMode: DesignerNodeMode;
		hasLeftEdge: boolean;
		hasRightEdge: boolean;
		expanded: boolean;
		onExpand: (name: string) => void;
	};
}

export function EdgeNode({ data, withoutGraph }: EdgeNodeProps) {
	const isLight = useIsLight();

	return (
		<BaseNode
			icon={mdiVectorLine}
			isLight={isLight}
			table={data.table}
			isSelected={data.isSelected}
			nodeMode={data.nodeMode}
			hasLeftEdge={!withoutGraph}
			hasRightEdge={!withoutGraph}
			withoutGraph={withoutGraph}
			expanded={data.expanded}
			onExpand={data.onExpand}
		/>
	);
}
