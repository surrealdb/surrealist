import { Group, HoverCard, Stack, Text } from "@mantine/core";
import { mdiCheck, mdiClockOutline, mdiClose } from "@mdi/js";
import dayjs from "dayjs";
import { ReactNode } from "react";
import { OpenFn } from "~/types";
import { TRUNCATE_STYLE } from "~/util/helpers";
import { Icon } from "../Icon";
import { RecordLink } from "../RecordLink";

const THING_REGEX = /^\w+:(\w+|[`⟨][^`⟩]+[`⟩])$/;
const DATETIME_REGEX = /^\d{4}-\d\d-\d\dt\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|z)?$/i;

export interface DataCellType {
	match: (value: any) => boolean;
	component: React.FC<DataCellProps>;
}

export interface DataCellProps {
	value: any;
	openRecord?: OpenFn;
}

// ----- Data Cell Types -----

function NullishCell(props: DataCellProps) {
	return (
		<Text color="light.5" ff="JetBrains Mono">
			{props.value === null ? "null" : "—"}
		</Text>
	);
}

function BooleanCell(props: DataCellProps) {
	const icon = props.value ? <Icon path={mdiCheck} color="green" /> : <Icon path={mdiClose} color="red" />;

	return <div>{icon}</div>;
}

function StringCell(props: DataCellProps) {
	return (
		<Text
			title={props.value}
			style={{
				...TRUNCATE_STYLE,
				maxWidth: 250,
			}}>
			{props.value}
		</Text>
	);
}

function NumberCell(props: DataCellProps) {
	return <Text>{props.value.toLocaleString()}</Text>;
}

function ThingCell(props: DataCellProps) {
	return <RecordLink value={props.value} onRecordClick={props.openRecord} />;
}

function DateTimeCell(props: DataCellProps) {
	const date = new Date(props.value);
	const relative = dayjs(date).fromNow();

	return (
		<Text title={`${date.toISOString()} (${relative})`}>
			<Icon path={mdiClockOutline} left mt={-3} />
			{date.toLocaleString()}
		</Text>
	);
}

function ArrayCell(props: DataCellProps) {
	const items = props.value as any[];

	return (
		<div>
			<HoverCard shadow="xl" withinPortal withArrow>
				<HoverCard.Target>
					<Text span ff="JetBrains Mono" style={{ cursor: "help" }}>
						Array({props.value.length})
					</Text>
				</HoverCard.Target>
				<HoverCard.Dropdown>
					{items.length > 15 ? (
						<Text size="sm">Too large to preview</Text>
					) : (
						<Stack spacing="sm">
							{items.map((item, i) => (
								<Group noWrap>
									<span style={{ opacity: 0.5 }}>#{i + 1}</span>
									<div key={i} style={TRUNCATE_STYLE}>
										{renderDataCell(item, props.openRecord)}
									</div>
								</Group>
							))}
						</Stack>
					)}
				</HoverCard.Dropdown>
			</HoverCard>
		</div>
	);
}

function ObjectCell(props: DataCellProps) {
	return (
		<div>
			<HoverCard width={280} shadow="md" withinPortal withArrow>
				<HoverCard.Target>
					<Text span ff="JetBrains Mono" style={{ cursor: "help" }}>
						Object({Object.keys(props.value).length})
					</Text>
				</HoverCard.Target>
				<HoverCard.Dropdown>
					<Text size="sm" ff="JetBrains Mono" style={{ whiteSpace: "pre" }} lineClamp={10}>
						{JSON.stringify(props.value, null, 4)}
					</Text>
				</HoverCard.Dropdown>
			</HoverCard>
		</div>
	);
}

const DataCellTypes = [
	{
		match: (value: any) => value === null || value === undefined,
		component: NullishCell,
	},
	{
		match: (value: any) => typeof value == "string" && THING_REGEX.test(value),
		component: ThingCell,
	},
	{
		match: (value: any) => typeof value == "string" && DATETIME_REGEX.test(value),
		component: DateTimeCell,
	},
	{
		match: (value: any) => typeof value === "boolean",
		component: BooleanCell,
	},
	{
		match: (value: any) => typeof value === "string",
		component: StringCell,
	},
	{
		match: (value: any) => typeof value === "number",
		component: NumberCell,
	},
	{
		match: (value: any) => Array.isArray(value),
		component: ArrayCell,
	},
	{
		match: (value: any) => typeof value === "object",
		component: ObjectCell,
	},
];

export function renderDataCell(value: any, openRecord?: OpenFn): ReactNode {
	for (const type of DataCellTypes) {
		// eslint-disable-next-line unicorn/prefer-regexp-test
		if (type.match(value)) {
			return type.component({
				value,
				openRecord,
			});
		}
	}

	return <Text color="red">Unknown</Text>;
}
