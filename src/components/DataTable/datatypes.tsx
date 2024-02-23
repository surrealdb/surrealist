import dayjs from "dayjs";
import { Group, HoverCard, Stack, Text } from "@mantine/core";
import { ReactNode } from "react";
import { TRUNCATE_STYLE } from "~/util/helpers";
import { Icon } from "../Icon";
import { RecordLink } from "../RecordLink";
import { validate_thing } from "~/generated/surrealist-embed";
import { iconCheck, iconClock, iconClose } from "~/util/icons";

const DATETIME_REGEX = /^\d{4}-\d\d-\d\dt\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|z)?$/i;

export interface DataCellType {
	match: (value: any) => boolean;
	component: React.FC<DataCellProps>;
}

export interface DataCellProps {
	value: any;
}

// ----- Data Cell Types -----

function NullishCell(props: DataCellProps) {
	return (
		<Text c="slate" ff="JetBrains Mono">
			{props.value === null ? "null" : "—"}
		</Text>
	);
}

function BooleanCell(props: DataCellProps) {
	const icon = props.value ? <Icon path={iconCheck} color="green" /> : <Icon path={iconClose} color="red" />;

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
	return <RecordLink value={props.value} />;
}

function DateTimeCell(props: DataCellProps) {
	const date = new Date(props.value);
	const relative = dayjs(date).fromNow();

	return (
		<Text title={`${date.toISOString()} (${relative})`}>
			<Icon path={iconClock} left mt={-3} />
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
						<Stack gap="sm">
							{items.map((item, i) => (
								<Group wrap="nowrap">
									<span style={{ opacity: 0.5 }}>#{i + 1}</span>
									<div key={i} style={TRUNCATE_STYLE}>
										{renderDataCell(item)}
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
		match: (value: any) => typeof value == "string" && validate_thing(value),
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

export function renderDataCell(value: any): ReactNode {
	for (const type of DataCellTypes) {
		// eslint-disable-next-line unicorn/prefer-regexp-test
		if (type.match(value)) {
			return type.component({ value });
		}
	}

	return <Text c="red">Unknown</Text>;
}
