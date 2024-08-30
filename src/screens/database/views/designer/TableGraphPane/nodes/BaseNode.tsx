import { Box, Divider, Flex, Group, Paper, ScrollArea, Stack, Text, Tooltip } from "@mantine/core";
import { TableInfo } from "~/types";
import { Handle, Position } from "reactflow";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { themeColor } from "~/util/mantine";
import { useActiveConnection } from "~/hooks/connection";
import { useIsLight } from "~/hooks/theme";
import { ON_STOP_PROPAGATION, extractType } from "~/util/helpers";
import { MouseEvent, ReactNode, useMemo, useRef } from "react";
import { iconBullhorn, iconIndex, iconJSON } from "~/util/icons";
import { extractKindRecords } from "~/util/surrealql";

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
		<Group pr={4} wrap="nowrap">
			<Icon path={props.icon} />
			<Text c={props.isLight ? "slate.9" : "white"}>
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

	const [kindName, tooltip] = useMemo(() => extractType(kind), [kind]);

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

interface FieldProps {
	isLight: boolean;
	name: string;
	value: ReactNode
}

function Field({
	isLight,
	name,
	value
}: FieldProps) {
	return (
		<Flex
			key={name}
			justify="space-between"
			gap="xl"
		>
			<Text
				title={name}
				c={isLight ? undefined : "white"}
			>
				{name}
			</Text>
			{value}
		</Flex>
	);
}

interface FieldsProps {
	isLight: boolean;
	table: TableInfo;
}

function Fields(props: FieldsProps) {
	const fields = props.table.fields.filter(f => f.name !== "in" && f.name !== "out" && f.name !== "id");
	const skipMouseUp = useRef(false);

	const onClick = (e: MouseEvent<HTMLElement>) => {
		if (skipMouseUp.current) {
			skipMouseUp.current = false;
			e.stopPropagation();
		}
	};

	return (
		<Box display="flex" style={{ cursor: 'pointer' }}>
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
						<Field
							key={field.name}
							isLight={props.isLight}
							name={field.name}
							value={field.kind ? (
								<FieldKind
									kind={field.kind}
								/>
							) : (
								<Text c="slate" title={field.kind}>
									none
								</Text>
							)}
						/>
					))}
				</Stack>
			</ScrollArea>
		</Box>
	);
}

interface BaseNodeProps {
	icon: string;
	table: TableInfo;
	isSelected: boolean;
	hasIncoming: boolean;
	hasOutgoing: boolean;
	isEdge?: boolean;
}

export function BaseNode({
	icon,
	table,
	isSelected,
	hasIncoming,
	hasOutgoing,
	isEdge,
}: BaseNodeProps) {
	const { diagramMode, diagramDirection } = useActiveConnection();

	const isLight = useIsLight();
	const isLTR = diagramDirection == 'ltr';
	const showMore = diagramMode == 'summary' || (diagramMode == 'fields' && table.fields.length > 0);

	const inField = table.fields.find(f => f.name === 'in');
	const outField = table.fields.find(f => f.name === 'out');

	return (
		<>
			<Handle
				type="target"
				position={isLTR ? Position.Left : Position.Right}
				style={{
					visibility: hasIncoming ? 'visible' : 'hidden'
				}}
			/>

			<Handle
				type="source"
				position={isLTR ? Position.Right : Position.Left}
				style={{
					visibility: hasOutgoing ? 'visible' : 'hidden'
				}}
			/>

			<Paper
				p="md"
				w={250}
				title={`Click to edit ${table.schema.name}`}
				bg={isLight ? "slate.0" : "slate.7"}
				shadow={`0 8px 15px rgba(30, 0, 80, ${isLight ? 0.025 : 0.05})`}
				style={{
					border: `1px solid ${themeColor(isSelected ? 'surreal' : isLight ? 'slate.2' : 'slate.5')}`,
					userSelect: 'none'
				}}
			>
				<Group
					style={{ color: isLight ? undefined : "white" }}
					gap="xs"
					wrap="nowrap"
				>
					<Icon
						path={icon}
						color={isSelected ? "surreal" : isLight ? "slate.7" : "slate.2"}
					/>
					<Text
						style={{
							textOverflow: 'ellipsis',
							overflow: 'hidden'
						}}
					>
						{table.schema.name}
					</Text>
				</Group>

				{isEdge && inField && outField && (
					<>
						<Divider
							color={isLight ? 'slate.2' : 'slate.6'}
							my="sm"
						/>
						<Stack
							gap="xs"
							mt={10}
							p={0}
						>
							<Field
								isLight={isLight}
								name="in"
								value={
									<Text ta="right">
										{extractKindRecords(inField.kind ?? "").join(", ")}
									</Text>
								}
							/>
							<Field
								isLight={isLight}
								name="out"
								value={
									<Text ta="right">
										{extractKindRecords(outField.kind ?? "").join(", ")}
									</Text>
								}
							/>
						</Stack>
					</>
				)}

				{showMore && (
					<>
						<Divider
							color={isLight ? 'slate.2' : 'slate.6'}
							mt="sm"
						/>

						{diagramMode == 'fields' ? (
							<Fields
								isLight={isLight}
								table={table}
							/>
						) : (
							<Stack gap="xs" mt={10} p={0}>
								<Summary
									isLight={isLight}
									icon={iconJSON}
									title="Fields"
									value={table.fields.length}
								/>
								<Summary
									isLight={isLight}
									icon={iconIndex}
									title="Indexes"
									value={table.indexes.length}
								/>
								<Summary
									isLight={isLight}
									icon={iconBullhorn}
									title="Events"
									value={table.events.length}
								/>
							</Stack>
						)}
					</>
				)}
			</Paper>
		</>
	);
}
