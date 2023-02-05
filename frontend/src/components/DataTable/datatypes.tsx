import { HoverCard, Text } from "@mantine/core";
import { mdiCheck, mdiClose } from "@mdi/js";
import { ReactNode } from "react";
import { OpenFn } from "~/typings";
import { Icon } from "../Icon";
import { RecordLink } from "../RecordLink";

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
		<Text
			color="light.5"
			ff="JetBrains Mono"
		>
			{props.value === null ? 'null' : '—'}
		</Text>
	);
}

function BooleanCell(props: DataCellProps) {
	const icon = props.value ? (
		<Icon path={mdiCheck} color="green" />
	) : (
		<Icon path={mdiClose} color="red" />
	);

	return (
		<div>{icon}</div>
	)
}

function StringCell(props: DataCellProps) {
	return (
		<Text
			title={props.value}
			style={{
				whiteSpace: 'nowrap',
				overflow: 'hidden',
				textOverflow: 'ellipsis',
				maxWidth: 250
			}}
		>
			{props.value}
		</Text>
	);
}

function NumberCell(props: DataCellProps) {
	return (
		<Text>
			{props.value.toLocaleString()}
		</Text>
	);
}

function ThingCell(props: DataCellProps) {
	return (
		<RecordLink
			value={props.value}
			onRecordClick={props.openRecord}
		/>
	)
}

function DateTimeCell(props: DataCellProps) {
	const date = new Date(props.value);

	return (
		<Text title={date.toISOString()}>
			{date.toLocaleString()}
		</Text>
	);
}

function ArrayObjectCell(props: DataCellProps) {
	const name = Array.isArray(props.value) ? 'Array' : 'Object';
	const size = Array.isArray(props.value) ? props.value.length : Object.keys(props.value).length;

	return (
		<div>
			<HoverCard
				width={280}
				shadow="md"
				withinPortal
				withArrow
			>
				<HoverCard.Target>
					<Text
						span
						ff="JetBrains Mono"
						style={{ cursor: 'help' }}
					>
						{name}({size})
					</Text>
				</HoverCard.Target>
				<HoverCard.Dropdown>
					<Text
						size="sm"
						ff="JetBrains Mono"
						style={{ whiteSpace: 'pre' }}
						lineClamp={10}
					>
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
		component: NullishCell
	},
	{
		match: (value: any) => typeof value == 'string' && /^\w+:[`⟨]?[\w-]+[`⟩]?$/.test(value),
		component: ThingCell
	},
	{
		match: (value: any) => typeof value == 'string' && !isNaN(Date.parse(value)),
		component: DateTimeCell
	},
	{
		match: (value: any) => typeof value === 'boolean',
		component: BooleanCell
	},
	{
		match: (value: any) => typeof value === 'string',
		component: StringCell
	},
	{
		match: (value: any) => typeof value === 'number',
		component: NumberCell
	},
	{
		match: (value: any) => typeof value === 'object',
		component: ArrayObjectCell
	}
];

export function renderDataCell(value: any, openRecord?: OpenFn): ReactNode {
	for (const type of DataCellTypes) {
		if (type.match(value)) {
			return type.component({
				value,
				openRecord
			});
		}
	}

	return <Text color="red">Unknown</Text>;
}