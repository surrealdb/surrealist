import { Divider, Flex, Group, Paper, Stack, Text, useMantineTheme } from "@mantine/core";
import { Handle, Position } from "reactflow";
import { DesignerNodeMode, TableDefinition } from "~/types";
import { useHandleStyle } from "../hooks";
import { Icon } from "~/components/Icon";
import { mdiBullhorn, mdiCodeBraces, mdiFlash } from "@mdi/js";
import { Spacer } from "~/components/Spacer";

interface SummaryProps {
	isLight: boolean;
	white: string;
	icon: string;
	title: string;
	value: number;
}

function Summary(props: SummaryProps) {
	const textColor = props.isLight ? "light.9" : props.white;

	return (
		<Group pr={4}>
			<Icon path={props.icon} color="surreal" />
			<Text color={textColor}>{props.title}</Text>
			<Spacer />
			<Text color={textColor} weight={700}>{props.value}</Text>
		</Group>
	);
}

interface BaseNodeProps {
	icon: string;
	isLight: boolean;
	table: TableDefinition;
	isSelected: boolean;
	hasLeftEdge: boolean;
	hasRightEdge: boolean;
	nodeMode: DesignerNodeMode;
	withoutGraph?: boolean;
}

export function BaseNode(props: BaseNodeProps) {
	const { colors, white, ...theme } = useMantineTheme();
	const { isLight, table, isSelected, hasLeftEdge, hasRightEdge, icon, nodeMode, withoutGraph } = props;

	const handleStyle = useHandleStyle();
	const primaryColor = theme.fn.primaryColor();

	return (
		<>
			{!withoutGraph && (
				<Handle
					type="target"
					position={Position.Left}
					style={{
						...handleStyle,
						visibility: hasLeftEdge ? "visible" : "hidden",
					}}
				/>
			)}

			<Paper
				w={withoutGraph ? undefined : 250}
				p={8}
				radius="md"
				title={`Click to edit ${table.schema.name}`}
				style={{
					backgroundColor: isLight ? 'hsl(210 17% 96% / 1)' : colors.dark[6],
					border: `2px solid ${isSelected ? primaryColor : 'transparent'}`,
					cursor: 'pointer'
				}}
			>
				<Group
					style={{ color: isLight ? undefined : "white" }}
					position="center"
					spacing="xs"
				>
					<Icon
						path={icon}
						color={isLight ? "light.5" : "light.4"}
					/>
					<Text align="center">
						{table.schema.name}
					</Text>
				</Group>

				{nodeMode != 'simple' && (
					<>
						<Divider
							color={isLight ? "light.1" : "dark.4"}
							mt={6}
						/>

						{nodeMode == 'fields' ? (
							<Stack spacing="xs" mt={10} p={0}>
								{table.fields.length === 0 && (
									<Text align="center" color={isLight ? "dimmed" : colors.dark[3]}>
										No fields defined
									</Text>
								)}
								{table.fields.map((field) => (
									<Flex key={field.name} justify="space-between">
										<Text color={isLight ? undefined : white}>{field.name}</Text>
										<Text color="surreal">{field.kind}</Text>
									</Flex>
								))}
							</Stack>
						) : (
							<Stack spacing="xs" mt={10} p={0}>
								<Summary
									isLight={isLight}
									white={white}
									icon={mdiCodeBraces}
									title="Fields"
									value={table.fields.length}
								/>
								<Summary
									isLight={isLight}
									white={white}
									icon={mdiFlash}
									title="Indexes"
									value={table.indexes.length}
								/>
								<Summary
									isLight={isLight}
									white={white}
									icon={mdiBullhorn}
									title="Events"
									value={table.events.length}
								/>
							</Stack>
						)}
					</>
				)}
			</Paper>

			{!withoutGraph && (
				<Handle
					type="source"
					position={Position.Right}
					style={{
						...handleStyle,
						visibility: hasRightEdge ? "visible" : "hidden",
					}}
				/>
			)}
		</>
	);
}
