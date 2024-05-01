import classes from "./style.module.scss";
import { Box, BoxProps, Text } from "@mantine/core";
import { ScrollArea, Table } from "@mantine/core";
import { MouseEvent, useMemo } from "react";
import { renderDataCell } from "./datatypes";
import { ColumnSort } from "~/types";
import { useIsLight } from "~/hooks/theme";
import { useStable } from "~/hooks/stable";
import { Icon } from "../Icon";
import { alphabetical, isObject } from "radash";
import { useInspector } from "~/providers/Inspector";
import { iconChevronDown, iconChevronUp } from "~/util/icons";

function isRenderable(value: any) {
	return Array.isArray(value) && value.every((v) => isObject(v));
}

interface DataTableProps extends BoxProps{
	data: any;
	active?: string | null;
	sorting?: ColumnSort | null;
	headers?: string[];
	onSortingChange?: (order: ColumnSort | null) => void;
	onRowContextMenu?: (event: MouseEvent, row: any) => void;
}

export function DataTable(props: DataTableProps) {
	const isLight = useIsLight();
	const { inspect } = useInspector();

	const {
		data,
		active,
		sorting,
		headers,
		onSortingChange,
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

	const [keys, values] = useMemo(() => {
		const keys: string[] = headers || [];
		const values: any[] = [];

		if (isRenderable(data)) {
			for (const datum of data) {
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

		return [headerNames, values];
	}, [data, headers, active]);

	const columnHeaders = useMemo(() => {
		return keys.map(key => (
			<Box
				key={key}
				component="th"
			>
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
					{sorting?.[0] == key && <Icon path={sorting[1] == "asc" ? iconChevronDown : iconChevronUp} pos="absolute" />}
				</Text>
			</Box>
		));
	}, [isLight, keys, sorting]);

	const recordRows = useMemo(() => {
		return values.map((value, i) => {
			const columns = [...keys].map((key, j) => {
				const cellValue = value[key];

				return (
					<Box key={j} component="td" className={classes.tableValue} h={37}>
						{renderDataCell(cellValue)}
					</Box>
				);
			});

			const isActive = active && value.id == active;

			return (
				<Box
					key={i}
					component="tr"
					onClick={() => value.id && inspect(value.id)}
					onContextMenu={(e) => props.onRowContextMenu?.(e, value)}
					style={{
						backgroundColor: `${isActive ? "var(--mantine-color-slate-6)" : undefined} !important`,
					}}
				>
					{columns}
				</Box>
			);
		});
	}, [keys, values, isLight]);

	if (!isRenderable(data)) {
		return <Text c="slate">Result could not be displayed as a table.</Text>;
	}

	return (
		<ScrollArea
			className={classes.root}
			scrollbars="xy"
			{...rest}
		>
			<Table className={classes.table}>
				<thead>
					<tr>{columnHeaders}</tr>
				</thead>
				<tbody>{recordRows}</tbody>
			</Table>
		</ScrollArea>
	);
}
