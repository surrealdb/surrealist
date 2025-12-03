import { Box, Divider, Flex, Group, Paper, ScrollArea, Stack, Text, Tooltip } from "@mantine/core";
import { Handle, Position } from "@xyflow/react";
import {
	createContext,
	type MouseEvent,
	type ReactNode,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { TABLE_VARIANT_ICONS } from "~/constants";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { getSurrealQL } from "~/screens/surrealist/connection/connection";
import { GraphWarning } from "~/screens/surrealist/views/designer/TableGraphPane/helpers";
import type { DiagramDirection, DiagramMode, TableInfo } from "~/types";
import { ON_STOP_PROPAGATION } from "~/util/helpers";
import { iconBullhorn, iconIndex, iconJSON } from "~/util/icons";
import { themeColor } from "~/util/mantine";
import { getTableVariant } from "~/util/schema";
import classes from "../style.module.scss";

export type DiagramContextProps = {
	warnings?: GraphWarning[];
};
export const DiagramContext = createContext<DiagramContextProps>({});

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

interface FieldSubKindProps {
	kind: string;
	groupIfComplex?: boolean;
	warnings?: GraphWarning[];
}

function FieldSubKind({ kind, groupIfComplex, warnings = [] }: FieldSubKindProps) {
	function isTargetTableValid(targetTable: string) {
		return !warnings?.find((w) => w.foreign === targetTable);
	}

	if (kind.startsWith("option<")) {
		return <span>{FieldSubKind({ kind: kind.slice(7, -1), groupIfComplex: true })}?</span>;
	} else if (kind.startsWith("array<")) {
		if (groupIfComplex) {
			return <span>({FieldSubKind({ kind: kind.slice(6, -1) })})[]</span>;
		} else {
			return <span>{FieldSubKind({ kind: kind.slice(6, -1), groupIfComplex: true })}[]</span>;
		}
	} else if (kind.startsWith("record<")) {
		let innerKind = kind.slice(7, -1);

		function printRecordKind(recordKind: string, omitAsterisk = false) {
			if (isTargetTableValid(recordKind)) {
				return (
					<span>
						{omitAsterisk ? "" : "*"}
						{recordKind}
					</span>
				);
			} else {
				return (
					<Tooltip
						position="top"
						openDelay={0}
						color="red"
						label={
							<Text
								fw={600}
								ff="monospace"
								c="black"
							>
								Table {recordKind} could not be found!
							</Text>
						}
					>
						<Text display="inline">
							{omitAsterisk ? "" : "*"}
							{recordKind}⚠️
						</Text>
					</Tooltip>
				);
			}
		}

		const alterations = [];
		for (let i = 0; i < innerKind.length; i++) {
			const char = innerKind[i];
			if (char === "`") {
				// read until next unescaped backtick
				const closingTick = innerKind.slice(i + 1).match(/[^\\]`/)?.index;
				if (closingTick === undefined) {
					throw new Error("Unclosed backtick in kind string");
				}

				i = closingTick + 2;
			} else if (char === "|") {
				alterations.push(innerKind.slice(0, i).trim());
				innerKind = innerKind.slice(i + 1).trim();
				i = -1;
			}
		}
		alterations.push(innerKind.trim());

		if (alterations.length > 1) {
			return (
				<span>
					*(
					{alterations.map((a, i) => (
						<span key={i}>
							{i > 0 ? "|" : ""}
							{printRecordKind(a, true)}
						</span>
					))}
					)
				</span>
			);
		} else {
			return printRecordKind(innerKind);
		}
	} else {
		let depth = 0;
		const alterations = [];
		for (let i = 0; i < kind.length; i++) {
			const char = kind[i];

			if (char === "`") {
				// read until next unescaped backtick
				const closingTick = kind.slice(i + 1).match(/[^\\]`/)?.index;
				if (closingTick === undefined) {
					throw new Error("Unclosed backtick in kind string");
				}

				i = closingTick + 2;
			} else if (char === "<") {
				depth++;
			} else if (char === ">") {
				depth--;
			} else if (char === "|" && depth === 0) {
				alterations.push(kind.slice(0, i).trim());
				kind = kind.slice(i + 1).trim();
				i = -1;
			}
		}
		alterations.push(kind.trim());

		if (alterations.length > 1) {
			if (groupIfComplex) {
				return (
					<span>
						(
						{alterations.map((k, i) => (
							<span key={i}>
								{i > 0 ? "|" : ""}
								<FieldSubKind kind={k} />
							</span>
						))}
						)
					</span>
				);
			} else {
				return alterations.map((k, i) => (
					<span key={i}>
						{i > 0 ? "|" : ""}
						<FieldSubKind kind={k} />
					</span>
				));
			}
		} else {
			return kind;
		}
	}
}

interface FieldKindProps {
	kind: string;
}

function FieldKind({ kind }: FieldKindProps) {
	const { warnings } = useContext(DiagramContext);

	const value = (
		<Text
			c="surreal.6"
			ff="mono"
			maw="50%"
			truncate
		>
			<FieldSubKind
				kind={kind}
				warnings={warnings}
			/>
		</Text>
	);

	// TODO: When do we want to show this vs not?
	if (!kind.includes("|") && kind.length < 30) {
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
			mah={"100%"}
			style={{ cursor: "pointer" }}
		>
			<ScrollArea
				flex={1}
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

interface BaseTableNodeProps {
	table: TableInfo;
	direction: DiagramDirection;
	mode: DiagramMode;
	isSelected: boolean;
	isEdge?: boolean;
}

export function BaseTableNode({ table, direction, mode, isSelected, isEdge }: BaseTableNodeProps) {
	const isLight = useIsLight();
	const isLTR = direction === "ltr";
	const showMore = mode === "summary" || (mode === "fields" && table.fields.length > 0);
	const variant = getTableVariant(table);

	const inField = table.fields.find((f) => f.name === "in");
	const outField = table.fields.find((f) => f.name === "out");

	const [inRecords, setInRecords] = useState<string>("");
	const [outRecords, setOutRecords] = useState<string>("");

	useEffect(() => {
		let cancelled = false;

		const loadRecords = async () => {
			if (inField) {
				const records = await getSurrealQL().extractKindRecords(inField.kind ?? "");
				if (!cancelled) {
					setInRecords(records.join(", "));
				}
			}
			if (outField) {
				const records = await getSurrealQL().extractKindRecords(outField.kind ?? "");
				if (!cancelled) {
					setOutRecords(records.join(", "));
				}
			}
		};

		loadRecords();

		return () => {
			cancelled = true;
		};
	}, [inField, outField]);

	return (
		<>
			<Handle
				type="target"
				position={isLTR ? Position.Left : Position.Right}
				style={{
					visibility: "hidden",
				}}
			/>

			<Handle
				type="source"
				position={isLTR ? Position.Right : Position.Left}
				style={{
					visibility: "hidden",
				}}
			/>

			<Paper
				p="md"
				title={`Click to edit ${table.schema.name}`}
				bg={
					table.schema.drop
						? `linear-gradient(-45deg, var(--diagonal-color-2) 12.5%, var(--diagonal-color-1) 12.5%, var(--diagonal-color-1) 50%, var(--diagonal-color-2) 50%, var(--diagonal-color-2) 62.5%, var(--diagonal-color-1) 62.5%, var(--diagonal-color-1) 100%) center / 8px 8px`
						: isLight
							? "white"
							: "slate.7"
				}
				shadow={`0 8px 12px rgba(0, 0, 0, ${isLight ? 0.075 : 0.2})`}
				style={{
					"--diagonal-color-1": `var(${isLight ? "white" : "--mantine-color-slate-7"})`,
					"--diagonal-color-2": `var(${isLight ? "--mantine-color-slate-1" : "--mantine-color-slate-6"})`,
					border: `${table.schema.full ? "2px solid" : "2px dashed"} ${themeColor(isSelected ? "surreal" : isLight ? "slate.2" : "slate.5")}`,
					userSelect: "none",
					backgroundSize: "8px 8px",
					overflow: "hidden",
					height: "100%",
				}}
			>
				<Group
					style={{ color: isLight ? undefined : "white" }}
					gap="xs"
					wrap="nowrap"
				>
					<Icon
						path={TABLE_VARIANT_ICONS[variant]}
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
								value={<Text ta="right">{inRecords}</Text>}
							/>
							<Field
								isLight={isLight}
								name="out"
								value={<Text ta="right">{outRecords}</Text>}
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

						{mode === "fields" ? (
							table.fields.length > 0 ? (
								<Fields
									isLight={isLight}
									table={table}
								/>
							) : (
								<Text
									c={isLight ? "slate.6" : "slate.4"}
									mt={10}
								>
									No fields defined.
								</Text>
							)
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
