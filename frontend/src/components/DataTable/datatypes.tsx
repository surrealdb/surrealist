import { Text } from "@mantine/core";
import { mdiArrowTopRight, mdiCheck, mdiClose } from "@mdi/js";
import { ReactNode } from "react";
import { OpenFn } from "~/typings";
import { Icon } from "../Icon";

export interface DataCellType {
	match: (value: any) => boolean;
	component: React.FC<DataCellProps>;
}

export interface DataCellProps {
	value: any;
	openRecord?: OpenFn;
}

// ----- Data Cell Types -----

function NullishCell(_props: DataCellProps) {
	return (
		<Text color="light.5">
			&mdash;
		</Text>
	);
}

function BooleanCell(props: DataCellProps) {
	return props.value ? (
		<Icon path={mdiCheck} color="green" />
	) : (
		<Icon path={mdiClose} color="red" />
	);
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
	const handleOpen = props.openRecord
		? () => props.openRecord?.(props.value)
		: undefined;

	return (
		<Text
			color="surreal"
			ff="JetBrains Mono"
			style={{ cursor: props.openRecord ? 'pointer' : undefined }}
			onClick={handleOpen}
		>
			{props.value}
			{props.openRecord && (
				<Icon
					path={mdiArrowTopRight}
					right
				/>
			)}
		</Text>
	);
}

function DateTimeCell(props: DataCellProps) {
	const date = new Date(props.value);

	return (
		<Text title={date.toISOString()}>
			{date.toLocaleString()}
		</Text>
	);
}

function ArrayCell(props: DataCellProps) {
	return (
		<Text>
			Array: {props.value.length}
		</Text>
	);
}

function ObjectCell(props: DataCellProps) {
	return (
		<Text>
			Object: {Object.keys(props.value).length}
		</Text>
	);
}

const DataCellTypes = [
	{
		match: (value: any) => value === null || value === undefined,
		component: NullishCell
	},
	{
		match: (value: any) => typeof value == 'string' && /\w+:\w+$/.test(value),
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
		match: (value: any) => Array.isArray(value),
		component: ArrayCell
	},
	{
		match: (value: any) => typeof value === 'object',
		component: ObjectCell
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