import { Flex, Paper, Stack, Text, useMantineTheme } from "@mantine/core";
import { Handle, Position } from "reactflow";
import { useIsLight } from "~/hooks/theme";
import { TableDefinition } from "~/types";
import { useHandleStyle } from "../hooks";

interface TableNodeProps {
	data: {
		table: TableDefinition;
		isSelected: boolean;
	}
}

export function TableNode({ data }: TableNodeProps) {
	const { colors, white, ...theme } = useMantineTheme();
	const { table, isSelected } = data;
	
	const isLight = useIsLight();
	const handleStyle = useHandleStyle();
	const primaryColor = theme.fn.primaryColor();

	return <>
		<Handle
			type="target"
			position={Position.Left}
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
			<Paper p={2} style={{ color: white, backgroundColor: primaryColor }}>
				<Text align="center">{table.schema.name}</Text>
			</Paper>

			<Stack
				spacing="xs"
				mt={10}
				p={0}
			>
				{table.fields.length === 0 && (
					<Text
						align="center"
						color={isLight ? "dimmed" : colors.dark[3]}
					>
						No fields defined
					</Text>
				)}
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
			style={handleStyle}
		/>
	</>;
}