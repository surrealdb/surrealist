import { Divider, Group, Text } from "@mantine/core";
import { useIsLight } from "~/hooks/theme";
import { DesignerNodeMode, TableDefinition } from "~/types";
import { BaseNode } from "./BaseNode";
import { Icon } from "~/components/Icon";
import { mdiTable } from "@mdi/js";
import { LIGHT_TEXT_1 } from "~/util/theme";

interface TableNodeProps {
	withoutGraph?: boolean;
	data: {
		table: TableDefinition;
		nodeMode: DesignerNodeMode;
		isSelected: boolean;
		hasLeftEdge: boolean;
		hasRightEdge: boolean;
	};
}

export function TableNode({ withoutGraph, data }: TableNodeProps) {
	const isLight = useIsLight();

	return (
		<BaseNode
			isLight={isLight}
			table={data.table}
			isSelected={data.isSelected}
			nodeMode={data.nodeMode}
			hasLeftEdge={!withoutGraph && data.hasLeftEdge}
			hasRightEdge={!withoutGraph && data.hasRightEdge}
			withoutGraph={withoutGraph}
		>
			<Group style={{ color: isLight ? undefined : "white" }} position="center" spacing="xs">
				<Icon path={mdiTable} color={LIGHT_TEXT_1} />
				<Text align="center">{data.table.schema.name}</Text>
			</Group>

			<Divider color={isLight ? "light.0" : "dark.4"} mt={6} />
		</BaseNode>
	);
}
