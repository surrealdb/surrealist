import { Button, Divider, Flex, Group, Paper, Stack, Text, useMantineTheme } from "@mantine/core";
import { mdiBullhorn, mdiChevronDown,  mdiChevronUp, mdiCodeBraces, mdiFlash } from "@mdi/js";
import { DesignerNodeMode, TableDefinition } from "~/types";
import { Handle, Position } from "reactflow";
import { useHandleStyle } from "../hooks";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { useStable } from "~/hooks/stable";
import { MAX_FIELDS } from "../helpers";

interface SummaryProps {
	isLight: boolean;
	white: string;
	icon: string;
	title: string;
	value: number;
}

function Summary(props: SummaryProps) {
	const valueColor = props.value > 0
		? "surreal"
		: "dimmed";

	return (
		<Group pr={4}>
			<Icon path={props.icon} color="light" />
			<Text color={props.isLight ? "light.9" : props.white}>{props.title}</Text>
			<Spacer />
			<Text
				color={valueColor}
				weight={600}
			>
				{props.value}
			</Text>
		</Group>
	);
}

interface ElementsProps {
	isLight: boolean;
	table: TableDefinition;
	expanded: boolean;
	onExpand: (name: string) => void;
}

function Elements(props: ElementsProps) {
	const { colors, white } = useMantineTheme();

	const fields = props.table.fields.slice(0, props.expanded ? undefined : MAX_FIELDS);
	const overflow = props.table.fields.length - MAX_FIELDS;

	const toggleOverflow = useStable((e: any) => {
		e.stopPropagation();
		props.onExpand(props.table.schema.name);
	});

	return (
		<Stack spacing="xs" mt={10} p={0}>
			{fields.length === 0 && (
				<Text align="center" color={props.isLight ? "dimmed" : colors.dark[3]}>
					No fields defined
				</Text>
			)}
			{fields.map((field) => (
				<Flex key={field.name} justify="space-between" gap="lg"> 
					<Text
						truncate
						color={props.isLight ? undefined : white}
						title={field.name}
					>
						{field.name}
					</Text>
					{field.kind ? (
						<Text
							truncate
							color="surreal"
							title={field.kind}
						>
							{field.kind}
						</Text>
					) : (
						<Text
							color="gray.7"
							title={field.kind}
						>
							none
						</Text>
					)}
				</Flex>
			))}
			{overflow > 0 && (
				<Button
					color="light"
					variant="subtle"
					onClick={toggleOverflow}
					size="xs"
					h={26}
				>
					{props.expanded ? `Show less` : `Show ${overflow} more`}
					<Icon
						path={props.expanded ? mdiChevronUp : mdiChevronDown}
						right
					/>
				</Button>
			)}
		</Stack>
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
	expanded: boolean;
	onExpand: (name: string) => void;
}

export function BaseNode(props: BaseNodeProps) {
	const { colors, white, ...theme } = useMantineTheme();
	const { isLight, table, isSelected, hasLeftEdge, hasRightEdge, icon, nodeMode, withoutGraph, expanded, onExpand } = props;

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
					backgroundColor: isLight ? colors.gray[1] : colors.dark[6],
					border: `2px solid ${isSelected ? primaryColor : 'transparent'}`,
					cursor: 'pointer',
					userSelect: 'none'
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
							color={isLight ? "gray.3" : "dark.4"}
							mt={6}
						/>

						{nodeMode == 'fields' ? (
							<Elements
								isLight={isLight}
								table={table}
								expanded={expanded}
								onExpand={onExpand}
							/>
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
