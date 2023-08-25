import { useMemo } from "react";
import { alphabetical, isObject } from "radash";
import { Center, Text } from "@mantine/core";
import { MRT_ColumnDef, MantineReactTable, useMantineReactTable } from "mantine-react-table";

import classes from "./style.module.scss";
import { renderDataCell } from "./datatypes";
import { TableBottomToolbar } from "./TableBottomToolbar";

function isRenderable(value: any) {
	return Array.isArray(value) && value.every((v) => isObject(v));
}

interface SimpleDataTableProps {
	data: any;
	active?: string | null;
}

export function SimpleDataTable({ data, active }: SimpleDataTableProps) {
	const [keys, values] = useMemo(() => {
		const keys: string[] = [];
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

		const headers = alphabetical(keys, (key) => {
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

		return [headers, values];
	}, [data, active]);

	const columns = useMemo<MRT_ColumnDef<any>[]>(() => {
		const columnDefs: MRT_ColumnDef<any>[] = [];

		// Future consideration: get the size of the largest
		// value in the column and use that as the size.
		for (const key of keys) {
			columnDefs.push({
				header: key,
				accessorKey: key,
				Cell: ({ cell }) => renderDataCell(cell.getValue()),
			});
		}

		return columnDefs;
	}, [keys]);

	if (!isRenderable(data)) {
		return <Text color="light.4">Result could not be displayed as a table.</Text>;
	}

	const table = useMantineReactTable({
		columns,
		data: values,
		enablePinning: true,
		enableTopToolbar: false, // we have a custom top toolbar
		enableStickyHeader: true,
		enableBottomToolbar: true,
		enableColumnResizing: true,
		enableColumnDragging: true,
		enableColumnOrdering: true,
		enableRowVirtualization: values.length > 100 ? true : false,
		mantineTableContainerProps: {
			className: classes.tableContainer,
			sx: { height: "calc(100% - 64px)" }, // css hack to make the table fill the panel
		},
		mantinePaperProps: {
			sx: {
				width: "100%",
				height: `100%`, // css hack to adjust for filter text
				borderRadius: 0,
				boxShadow: "none",
				position: "absolute",
				border: "none !important",
				borderBottomLeftRadius: "0.5rem",
				borderBottomRightRadius: "0.5rem",
			},
		},
		rowCount: values.length,
		mantinePaginationProps: {
			rowsPerPageOptions: ["5", "10", "25", "30", "50", "100", "250", "500"],
		},
		renderBottomToolbar: ({ table }) => <TableBottomToolbar table={table} />,
	});

	return values.length === 0 ? (
		<Center h="90%" c="light.5">
			Table has no records
		</Center>
	) : (
		<MantineReactTable table={table} />
	);
}
