import { Divider, Group, Text } from "@mantine/core";
import { mdiVectorLine } from "@mdi/js";
import { Icon } from "~/components/Icon";
import { useIsLight } from "~/hooks/theme";
import { TableDefinition } from "~/types";
import { LIGHT_TEXT_1 } from "~/util/theme";
import { BaseNode } from "./BaseNode";

interface EdgeNodeProps {
	data: {
		table: TableDefinition;
		isSelected: boolean;
	}
}

export function EdgeNode({ data }: EdgeNodeProps) {
	const isLight = useIsLight();

	return (
		<BaseNode
			isLight={isLight}
			table={data.table}
			isSelected={data.isSelected}
			hasLeftEdge={true}
			hasRightEdge={true}
		>
			<Group
				style={{ color: isLight ? undefined : 'white' }}
				position="center"
				spacing="xs"
			>
				<Icon path={mdiVectorLine} color={LIGHT_TEXT_1} />
				<Text align="center">
					{data.table.schema.name}
				</Text>
			</Group>

			<Divider
				color={isLight ? 'light.0' : 'dark.4'}
				mt={6}
			/>
		</BaseNode>
	);
}