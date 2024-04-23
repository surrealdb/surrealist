import dayjs from "dayjs";
import { RecordId, Decimal } from "surrealdb.js";
import { Group, HoverCard, Stack, Text } from "@mantine/core";
import { ReactNode } from "react";
import { TRUNCATE_STYLE } from "~/util/helpers";
import { Icon } from "../Icon";
import { RecordLink } from "../RecordLink";
import { iconCheck, iconClock, iconClose } from "~/util/icons";

// ----- Data Cell Types -----

function NullishCell(props: { value: null | undefined }) {
	return (
		<Text c="slate" ff="JetBrains Mono">
			{props.value === null ? "null" : "—"}
		</Text>
	);
}

function BooleanCell(props: { value: boolean }) {
	const icon = props.value
		? <Icon path={iconCheck} color="green" />
		: <Icon path={iconClose} color="pink.9" />;

	return <div>{icon}</div>;
}

function StringCell(props: { value: string }) {
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

function NumberCell(props: { value: number }) {
	return <Text>{props.value.toLocaleString()}</Text>;
}

function ThingCell(props: { value: RecordId }) {
	return <RecordLink value={props.value} />;
}

function DateTimeCell(props: { value: Date }) {
	const date = new Date(props.value);
	const relative = dayjs(date).fromNow();

	return (
		<Text title={`${date.toISOString()} (${relative})`}>
			<Icon path={iconClock} left mt={-3} />
			{date.toLocaleString()}
		</Text>
	);
}

function ArrayCell(props: { value: any[] }) {
	const items = props.value ;

	return (
		<div>
			<HoverCard shadow="xl" withArrow>
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

function ObjectCell(props: { value: any }) {
	return (
		<div>
			<HoverCard width={280} shadow="md" withArrow>
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

export function renderDataCell(value: any): ReactNode {
	if (value instanceof Date) {
		return <DateTimeCell value={value} />;
	}

	if (value === undefined || value === null) {
		return <NullishCell value={value} />;
	}

	if (typeof value === "boolean") {
		return <BooleanCell value={value} />;
	}

	if (value instanceof Decimal) {
		return <NumberCell value={value.toNumber()} />;
	}

	if (typeof value === "number") {
		return <NumberCell value={value} />;
	}

	if (value instanceof RecordId) {
		return <ThingCell value={value} />;
	}

	if (Array.isArray(value)) {
		return <ArrayCell value={value} />;
	}

	if (typeof value === "object") {
		return <ObjectCell value={value} />;
	}

	return <StringCell value={value.toString()} />;
}
