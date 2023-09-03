import { Paper, Text } from "@mantine/core";
import { useIsLight } from "~/hooks/theme";
import { DesignerNodeMode, TableDefinition } from "~/types";
import { BaseNode } from "./BaseNode";

interface TableNodeProps {
	data: {
		table: TableDefinition;
		nodeMode: DesignerNodeMode;
		isSelected: boolean;
		hasLeftEdge: boolean;
		hasRightEdge: boolean;
	};
}

export function TableNode({ data }: TableNodeProps) {
	const isLight = useIsLight();

	return (
		<BaseNode
			isLight={isLight}
			table={data.table}
			isSelected={data.isSelected}
			nodeMode={data.nodeMode}
			hasLeftEdge={data.hasLeftEdge}
			hasRightEdge={data.hasRightEdge}
		>
			<Paper p={2} c="white" bg="surreal">
				<Text align="center">{data.table.schema.name}</Text>
			</Paper>
		</BaseNode>
	);
}
