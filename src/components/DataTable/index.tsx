import { Box, type BoxProps, Group, Text } from "@mantine/core";
import { ScrollArea, Table } from "@mantine/core";
import { alphabetical, isObject } from "radash";
import { type MouseEvent, useMemo } from "react";
import { useStable } from "~/hooks/stable";
import { useInspector } from "~/providers/Inspector";
import type { ColumnSort } from "~/types";
import { iconChevronDown, iconChevronUp, iconWarning } from "~/util/icons";
import { Icon } from "../Icon";
import { DataCell } from "./datatypes";
import classes from "./style.module.scss";

function isRenderable(value: any) {
	return Array.isArray(value) && value.every((v) => isObject(v));
}

interface DataTableProps extends BoxProps {
	data: any;
	active?: string | null;
	sorting?: ColumnSort | null;
	headers?: string[];
	onSortingChange?: (order: ColumnSort | null) => void;
	onRowContextMenu?: (event: MouseEvent, row: any) => void;
}

export function DataTable(props: DataTableProps) {
	const { inspect } = useInspector();

	const {
		data,
		active,
		sorting,
		headers,
		onSortingChange,
		onRowContextMenu,
		className,
		...rest
	} = props;

	const handleSortClick = useStable((col: string) => {
		if (!onSortingChange) return;

		const [column, direction] = sorting || [];

		if (column === col && direction === "asc") {
			onSortingChange([col, "desc"]);
		} else if (column === col && direction === "desc") {
			onSortingChange(null);
		} else {
			onSortingChange([col, "asc"]);
		}
	});

	const [keys, values, truncated] = useMemo(() => {
		const keys: string[] = headers || [];
		const values: any[] = [];

		let truncated = false;

		if (isRenderable(data)) {
			for (const datum of data) {
				if (values.length >= 100) {
					truncated = true;
					break;
				}

				const row: any = {};

				for (const [key, value] of Object.entries(datum)) {
					if (!keys.includes(key)) {
						keys.push(key);
					}

					row[key] = value;
				}

				values.push(row);
			}
		}

		const headerNames = alphabetical(keys, (key) => {
			switch (key) {
				case "id": {
					return "00000000000";
				}
				case "in": {
					return "00000000001";
				}
				case "out": {
					return "00000000002";
				}
				default: {
					return key;
				}
			}
		});

		return [headerNames, values, truncated];
	}, [data, headers]);

	const columnHeaders = useMemo(() => {
		return keys.map((key) => (
			<Box key={key} component="th">
				<Text
					span
					fw={700}
					onClick={() => handleSortClick(key)}
					style={{
						cursor: onSortingChange ? "pointer" : undefined,
						userSelect: "none",
						WebkitUserSelect: "none",
					}}
				>
					{key}
					{sorting?.[0] === key && (
						<Icon
							path={
								sorting[1] === "asc"
									? iconChevronDown
									: iconChevronUp
							}
							pos="absolute"
						/>
					)}
				</Text>
			</Box>
		));
	}, [keys, sorting, onSortingChange]);

	const recordRows = useMemo(() => {
		return values.map((value, i) => {
			const columns = [...keys].map((key, j) => {
				const cellValue = value[key];

				return (
					<Box
						key={j}
						component="td"
						className={classes.tableValue}
						h={37}
					>
						<DataCell value={cellValue} />
					</Box>
				);
			});

			const isActive = active && value.id === active;

			return (
				<Box
					key={i}
					component="tr"
					onClick={() => value.id && inspect(value.id)}
					onContextMenu={(e) => onRowContextMenu?.(e, value)}
					style={{
						backgroundColor: `${isActive ? "var(--mantine-color-slate-6)" : undefined} !important`,
					}}
				>
					{columns}
				</Box>
			);
		});
	}, [keys, values, active, inspect, onRowContextMenu]);

	if (!isRenderable(data)) {
		return <Text c="slate">Result could not be displayed as a table.</Text>;
	}

	return (
		<ScrollArea className={classes.root} scrollbars="xy" {...rest}>
			<Table className={classes.table}>
				<thead>
					<tr>{columnHeaders}</tr>
				</thead>
				<tbody>{recordRows}</tbody>
			</Table>
			{truncated && (
				<Group mt="md" mb="xl" c="red">
					<Icon path={iconWarning} />
					The rows have been truncated to 100 for performance reasons
				</Group>
			)}
		</ScrollArea>
	);
}
