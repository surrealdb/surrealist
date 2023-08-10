import { Container, Flex, Paper, Text, useMantineTheme } from "@mantine/core";
import { Handle, Position } from "reactflow";
import { useIsLight } from "~/hooks/theme";
import { TableDefinition } from "~/types";

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
	const primaryColor = theme.fn.primaryColor();

	return <>
		<Handle type="target" position={Position.Left} />
		<Paper
			w={250}
			h={100}
			p={8}
			shadow="md"
			radius="md"
			style={{
				backgroundColor: isLight ? white : colors.dark[6],
				border: isSelected ?
					`2px solid ${primaryColor}` :
					'none'
			}}
		>
			<Paper p={2} style={{ color: white, backgroundColor: primaryColor }}>
				<Text align="center">{table.schema.name}</Text>
			</Paper>

			<Container mt={10} p={0}>
				{table.fields.map(field => (
					<Flex key={field.name} mt={1.5} justify="space-between">
						<Text color={white}>{field.name}</Text>
						<Text color={isLight ? "dimmed" : colors.dark[3]}>{field.kind}</Text>
					</Flex>
				))}
			</Container>
		</Paper>

		<Handle type="source" position={Position.Right} />
	</>;
}