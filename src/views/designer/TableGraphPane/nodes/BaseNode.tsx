import { Box, Divider, Flex, Group, Paper, ScrollArea, Stack, Text, Tooltip } from "@mantine/core";
import { mdiBullhorn, mdiCodeBraces, mdiFlash } from "@mdi/js";
import { TableDefinition } from "~/types";
import { Handle, Position } from "reactflow";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { themeColor } from "~/util/mantine";
import { useActiveConnection } from "~/hooks/connection";
import { useIsLight } from "~/hooks/theme";
import { ON_STOP_PROPAGATION, extractType } from "~/util/helpers";
import { MouseEvent, useMemo, useRef } from "react";

interface SummaryProps {
	isLight: boolean;
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
			<Text c={props.isLight ? "light.9" : "white"}>
				{props.title}
			</Text>
			<Spacer />
			<Text
				c={valueColor}
				fw={600}
			>
				{props.value}
			</Text>
		</Group>
	);
}

interface FieldKindProps {
	kind: string;
}

function FieldKind({ kind }: FieldKindProps) {

	const [kindName, tooltip] = useMemo(() => {
		return extractType(kind);
	}, []);

	const value = (
		<Text c="surreal.6" ff="mono" maw="50%">
			{kindName}
		</Text>
	);

	if (tooltip.length === 0) {
		return value;
	}

	const items = (
		<Box>
			{tooltip.map((type) => (
				<Text key={type} fw={500}>
					{type}
				</Text>
			))}
		</Box>
	);

	return (
		<Tooltip
			position="top"
			label={items}
			openDelay={0}
		>
			{value}
		</Tooltip>
	);
}

interface FieldsProps {
	isLight: boolean;
	table: TableDefinition;
}

function Fields(props: FieldsProps) {
	const fields = props.table.fields;

	const skipMouseUp = useRef(false);

	const onClick = (e: MouseEvent<HTMLElement>) => {
		if (skipMouseUp.current) {
			skipMouseUp.current = false;
			e.stopPropagation();
		}
	};

	return (
		<Box display="flex">
			<ScrollArea
				flex={1}
				mah={210}
				onScrollPositionChange={() => skipMouseUp.current = true}
				onClickCapture={onClick}
				onWheelCapture={ON_STOP_PROPAGATION}
				onMouseDownCapture={ON_STOP_PROPAGATION}
				onMouseUpCapture={ON_STOP_PROPAGATION}
			>
				<Stack
					gap="xs"
					mt={10}
					p={0}
				>
					{fields.map((field) => (
						<Flex key={field.name} justify="space-between" gap="lg"> 
							<Text
								truncate
								title={field.name}
								c={props.isLight ? undefined : "white"}
							>
								{field.name}
							</Text>
							{field.kind ? (
								<FieldKind
									kind={field.kind}
								/>
							) : (
								<Text c="slate" title={field.kind}>
									none
								</Text>
							)}
						</Flex>
					))}
				</Stack>
			</ScrollArea>
		</Box>
	);
}

interface BaseNodeProps {
	icon: string;
	table: TableDefinition;
	isSelected: boolean;
	hasLeftEdge: boolean;
	hasRightEdge: boolean;
	withoutGraph?: boolean;
}

export function BaseNode(props: BaseNodeProps) {
	const { table, isSelected, hasLeftEdge, hasRightEdge, icon, withoutGraph } = props;

	const isLight = useIsLight();
	const { designerNodeMode } = useActiveConnection();

	const showMore = designerNodeMode == 'summary' || (designerNodeMode == 'fields' && table.fields.length > 0);

	return (
		<>
			{!withoutGraph && (
				<Handle
					type="target"
					position={Position.Left}
					style={{
						visibility: hasLeftEdge ? "visible" : "hidden"
					}}
				/>
			)}

			<Paper
				p="md"
				w={withoutGraph ? undefined : 250}
				title={`Click to edit ${table.schema.name}`}
				bg={isLight ? "white" : "slate.7"}
				shadow={`0 8px 15px var(--mantine-color-slate-${isLight ? 0 : 9}`}
				style={{
					border: `1px solid ${themeColor(isSelected ? 'surreal' : isLight ? 'slate.2' : 'slate.5')}`,
					cursor: 'pointer',
					userSelect: 'none'
				}}
			>
				<Group
					style={{ color: isLight ? undefined : "white" }}
					gap="xs"
				>
					<Icon
						path={icon}
						color={isSelected ? "surreal" : isLight ? "light.2" : "slate.4"}
					/>
					<Text>
						{table.schema.name}
					</Text>
				</Group>

				{showMore && (
					<>
						<Divider
							color={isLight ? 'slate.2' : 'slate.6'}
							mt="sm"
						/>

						{designerNodeMode == 'fields' ? (
							<Fields
								isLight={isLight}
								table={table}
							/>
						) : (
							<Stack gap="xs" mt={10} p={0}>
								<Summary
									isLight={isLight}
									icon={mdiCodeBraces}
									title="Fields"
									value={table.fields.length}
								/>
								<Summary
									isLight={isLight}
									icon={mdiFlash}
									title="Indexes"
									value={table.indexes.length}
								/>
								<Summary
									isLight={isLight}
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
						visibility: hasRightEdge ? "visible" : "hidden",
					}}
				/>
			)}
		</>
	);
}
