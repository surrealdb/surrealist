import classes from "./style.module.scss";
import dayjs from "dayjs";
import { RecordId, Decimal, GeometryPoint, GeometryLine, GeometryMultiPoint, GeometryMultiLine, GeometryPolygon, GeometryMultiPolygon, GeometryCollection, Uuid } from "surrealdb.js";
import { Group, HoverCard, Stack, Text } from "@mantine/core";
import { TRUNCATE_STYLE } from "~/util/helpers";
import { Icon } from "../Icon";
import { RecordLink } from "../RecordLink";
import { iconCheck, iconClock, iconClose } from "~/util/icons";
import { formatValue } from "~/util/surrealql";
import { convert } from 'geo-coordinates-parser';
import { GeographyLink } from "../GeographyLink";

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

function UuidCell(props: { value: Uuid }) {
	return (
		<Text ff="monospace" c="bright">
			{props.value.toString()}
		</Text>
	);
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
	const items = props.value;
	const preview = items.slice(0, 10);

	return (
		<div>
			<HoverCard
				shadow="xl"
				withArrow
				position="bottom-start"
			>
				<HoverCard.Target>
					<Text span ff="JetBrains Mono" style={{ cursor: "help" }}>
						Array({props.value.length})
					</Text>
				</HoverCard.Target>
				<HoverCard.Dropdown>
					<Stack gap="sm">
						{preview.map((item, i) => (
							<Group key={i} wrap="nowrap">
								<span style={{ opacity: 0.5 }}>#{i + 1}</span>
								<div key={i} style={TRUNCATE_STYLE}>
									<DataCell value={item} />
								</div>
							</Group>
						))}
						{items.length > 10 && (
							<Text size="sm" c="bright">
								And {items.length - 10} more...
							</Text>
						)}
					</Stack>
				</HoverCard.Dropdown>
			</HoverCard>
		</div>
	);
}

function ObjectCell(props: { value: any }) {
	return (
		<div>
			<HoverCard
				width={280}
				shadow="md"
				withArrow
				position="bottom-start"
			>
				<HoverCard.Target>
					<Text span ff="JetBrains Mono" style={{ cursor: "help" }}>
						Object({Object.keys(props.value).length})
					</Text>
				</HoverCard.Target>
				<HoverCard.Dropdown>
					<Text
						size="sm"
						ff="JetBrains Mono"
						lineClamp={10}
						className={classes.sourceCode}
					>
						{formatValue(props.value, false, true)}
					</Text>
				</HoverCard.Dropdown>
			</HoverCard>
		</div>
	);
}

function GeographyPointCell({ value }: { value: GeometryPoint; }) {
	const [long, lat] = value.point;
	const converted = convert(`${lat} ${long}`);

	return <GeographyLink value={value} text={converted.toCoordinateFormat("DMS")} />;
}

function GeographyLineStringCell({ value }: { value: GeometryLine; }) {
	return <GeographyLink value={value} text="LineString" />;
}

function GeographyPolygonCell({ value }: { value: GeometryPolygon; }) {
	return <GeographyLink value={value} text="Polygon" />;
}

function GeographyMultiPointCell({ value }: { value: GeometryMultiPoint; }) {
	return <GeographyLink value={value} text="MultiPoint" />;
}

function GeographyMultiLineCell({ value }: { value: GeometryMultiLine; }) {
	return <GeographyLink value={value} text="MultiLineString" />;
}

function GeographyMultiPolygonCell({ value }: { value: GeometryMultiPolygon; }) {
	return <GeographyLink value={value} text="MultiPolygon" />;
}

function GeographyCollectionCell({ value }: { value: GeometryCollection; }) {
	return <GeographyLink value={value} text="GeometryCollection" />;
}

export const DataCell = ({ value }: { value: any }) => {
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
		return <NumberCell value={Number(value.toString())} />;
	}

	if (typeof value === "number") {
		return <NumberCell value={value} />;
	}

	if (value instanceof Uuid) {
		return <UuidCell value={value} />;
	}

	if (value instanceof RecordId) {
		return <ThingCell value={value} />;
	}

	if (value instanceof GeometryPoint) {
		return <GeographyPointCell value={value} />;
	}

	if (value instanceof GeometryLine) {
		return <GeographyLineStringCell value={value} />;
	}

	if (value instanceof GeometryPolygon) {
		return <GeographyPolygonCell value={value} />;
	}

	if (value instanceof GeometryMultiPoint) {
		return <GeographyMultiPointCell value={value} />;
	}

	if (value instanceof GeometryMultiLine) {
		return <GeographyMultiLineCell value={value} />;
	}

	if (value instanceof GeometryMultiPolygon) {
		return <GeographyMultiPolygonCell value={value} />;
	}

	if (value instanceof GeometryCollection) {
		return <GeographyCollectionCell value={value} />;
	}

	if (Array.isArray(value)) {
		return <ArrayCell value={value} />;
	}

	if (typeof value === "object") {
		return <ObjectCell value={value} />;
	}

	return <StringCell value={value.toString()} />;
};
