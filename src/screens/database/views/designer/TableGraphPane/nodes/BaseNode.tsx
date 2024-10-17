import { Box, Divider, Flex, Group, Paper, ScrollArea, Stack, Text, Tooltip } from "@mantine/core";
import { type MouseEvent, type ReactNode, useRef } from "react";
import { Handle, Position } from "reactflow";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { useActiveConnection } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import type { TableInfo } from "~/types";
import { ON_STOP_PROPAGATION, simplifyKind } from "~/util/helpers";
import { iconBullhorn, iconIndex, iconJSON } from "~/util/icons";
import { themeColor } from "~/util/mantine";
import { extractKindRecords } from "~/util/surrealql";
import classes from "../style.module.scss";

interface SummaryProps {
	isLight: boolean;
	icon: string;
	title: string;
	value: number;
}

function Summary(props: SummaryProps) {
	const valueColor = props.value > 0 ? "surreal" : "dimmed";

	return (
		<Group
			pr={4}
			wrap="nowrap"
		>
			<Icon path={props.icon} />
			<Text c={props.isLight ? "slate.9" : "white"}>{props.title}</Text>
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
	const simpleKind = simplifyKind(kind);

	const value = (
		<Text
			c="surreal.6"
			ff="mono"
			maw="50%"
			truncate
		>
			{simpleKind}
		</Text>
	);

	if (kind === simpleKind) {
		return value;
	}

	return (
		<Tooltip
			position="top"
			openDelay={0}
			label={
				<Text
					fw={500}
					ff="monospace"
				>
					{kind}
				</Text>
			}
		>
			{value}
		</Tooltip>
	);
}

interface FieldProps {
	isLight: boolean;
	name: string;
	value: ReactNode;
}

function Field({ isLight, name, value }: FieldProps) {
	return (
		<Flex
			key={name}
			justify="space-between"
			gap="xl"
		>
			<Text
				title={name}
				c={isLight ? undefined : "white"}
				truncate
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
	const fields = props.table.fields.filter(
		(f) => f.name !== "in" && f.name !== "out" && f.name !== "id",
	);
	const skipMouseUp = useRef(false);

	const onClick = (e: MouseEvent<HTMLElement>) => {
		if (skipMouseUp.current) {
			skipMouseUp.current = false;
			e.stopPropagation();
		}
	};

	const skipMouse = useStable(() => {
		skipMouseUp.current = true;
	});

	return (
		<Box
			display="flex"
			style={{ cursor: "pointer" }}
		>
			<ScrollArea
				flex={1}
				mah={210}
				onClickCapture={onClick}
				onWheelCapture={ON_STOP_PROPAGATION}
				onMouseDownCapture={ON_STOP_PROPAGATION}
				onMouseUpCapture={ON_STOP_PROPAGATION}
				className={classes.fieldsScroll}
				onScrollPositionChange={skipMouse}
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
							value={
								field.kind ? (
									<FieldKind kind={field.kind} />
								) : (
									<Text
										c="slate"
										title={field.kind}
									>
										none
									</Text>
								)
							}
						/>
					))}
				</Stack>
			</ScrollArea>
		</Box>
	);
}

interface BaseNodeProps {
	id: string;
	icon: string;
	table: TableInfo;
	isSelected: boolean;
	hasIncoming: boolean;
	hasOutgoing: boolean;
	isEdge?: boolean;
}

export function BaseNode({
	id,
	icon,
	table,
	isSelected,
	hasIncoming,
	hasOutgoing,
	isEdge,
}: BaseNodeProps) {
	const { diagramMode, diagramDirection } = useActiveConnection();

	const isLight = useIsLight();
	const isLTR = diagramDirection === "ltr";
	const showMore =
		diagramMode === "summary" || (diagramMode === "fields" && table.fields.length > 0);

	const inField = table.fields.find((f) => f.name === "in");
	const outField = table.fields.find((f) => f.name === "out");

	return (
		<>
			<Handle
				type="target"
				position={isLTR ? Position.Left : Position.Right}
				style={{
					visibility: hasIncoming ? "visible" : "hidden",
				}}
			/>

			<Handle
				type="source"
				position={isLTR ? Position.Right : Position.Left}
				style={{
					visibility: hasOutgoing ? "visible" : "hidden",
				}}
			/>

			<Paper
				p="md"
				w={250}
				title={`Click to edit ${table.schema.name}`}
				bg={isLight ? "slate.0" : "slate.7"}
				shadow={`0 8px 15px rgba(30, 0, 80, ${isLight ? 0.025 : 0.05})`}
				style={{
					border: `1px solid ${themeColor(isSelected ? "surreal" : isLight ? "slate.2" : "slate.5")}`,
					userSelect: "none",
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
							textOverflow: "ellipsis",
							overflow: "hidden",
						}}
					>
						{table.schema.name}
					</Text>
				</Group>

				{isEdge && inField && outField && (
					<>
						<Divider
							color={isLight ? "slate.2" : "slate.6"}
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
							color={isLight ? "slate.2" : "slate.6"}
							mt="sm"
						/>

						{diagramMode === "fields" ? (
							<Fields
								isLight={isLight}
								table={table}
							/>
						) : (
							<Stack
								gap="xs"
								mt={10}
								p={0}
							>
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
