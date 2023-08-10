import { Divider, Flex, Group, Paper, Stack, Text, useMantineTheme } from "@mantine/core";
import { mdiVectorLine } from "@mdi/js";
import { Handle, Position } from "reactflow";
import { Icon } from "~/components/Icon";
import { useIsLight } from "~/hooks/theme";
import { TableDefinition } from "~/types";
import { LIGHT_TEXT_1 } from "~/util/theme";
import { useHandleStyle } from "../hooks";

interface EdgeNodeProps {
	data: {
		table: TableDefinition;
		isSelected: boolean;
	}
}

export function EdgeNode({ data }: EdgeNodeProps) {
	const { colors, white, ...theme } = useMantineTheme();
	const { table, isSelected } = data;

	const isLight = useIsLight();
	const handleStyle = useHandleStyle();
	const primaryColor = theme.fn.primaryColor();

	return <>
		<Handle
			type="target"
			position={Position.Left}
			isConnectable={false}
			style={handleStyle}
		/>
		
		<Paper
			w={250}
			p={8}
			shadow="md"
			radius="md"
			style={{
				backgroundColor: isLight ? white : colors.dark[6],
				border: `2px solid ${isSelected ? primaryColor : isLight ? colors.light[2] : colors.dark[6]}`
			}}
		>
			<Group
				style={{ color: isLight ? undefined : white }}
				position="center"
				spacing="xs"
			>
				<Icon path={mdiVectorLine} color={LIGHT_TEXT_1} />
				<Text align="center">
					{table.schema.name}
				</Text>
			</Group>

			<Divider
				color={isLight ? 'light.0' : 'dark.4'}
				mt={6}
			/>

			<Stack
				spacing="xs"
				mt={10}
				p={0}
			>
				{table.fields.map(field => (
					<Flex key={field.name} justify="space-between">
						<Text color={isLight ? undefined : white}>{field.name}</Text>
						<Text color={isLight ? "dimmed" : colors.dark[3]}>{field.kind}</Text>
					</Flex>
				))}
			</Stack>
		</Paper>

		<Handle
			type="source"
			position={Position.Right}
			isConnectable={false}
			style={handleStyle}
		/>
	</>;
}