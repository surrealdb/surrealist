import { ScrollArea, Table, Text } from "@mantine/core";
import { useMemo } from "react";
import { OpenFn } from "~/types";
import { alphabetical, isObject } from "radash";
import {
	MRT_BottomToolbar,
	MRT_ColumnDef,
	MRT_TableFooterCell,
	MRT_TablePagination,
	MantineReactTable,
	useMantineReactTable,
} from "mantine-react-table";
import { renderDataCell } from "./datatypes";
import classes from "./style.module.scss";
import { TableBottomToolbar } from "./TableBottomToolbar";
import { TablePagination } from "./TablePagination";

function isRenderable(value: any) {
	return Array.isArray(value) && value.every((v) => isObject(v));
}

interface DataTableProps {
	data: any;
	active?: string | null;
	openRecord?: OpenFn;
	onRowClick?: (value: any) => void;
}

export function DataTable({ data, active, openRecord, onRowClick }: DataTableProps) {
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
				Cell: ({ cell }) => renderDataCell(cell.getValue(), openRecord),
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
		enableTopToolbar: false,
		enableBottomToolbar: true,
		enableColumnResizing: true,
		enableStickyHeader: true,
		mantineTableContainerProps: {
			className: classes.tableContainer,
			sx: {
				height: "calc(100% - 64px)", // css hack to size correctly 68 is bottom margin
			},
		},
		mantinePaperProps: {
			sx: {
				width: "100%",
				height: "100%",
				borderRadius: 0,
				boxShadow: "none",
				position: "absolute",
				border: "none !important",
				borderBottomLeftRadius: "0.5rem",
				borderBottomRightRadius: "0.5rem",
			},
		},
		mantinePaginationProps: {
			rowsPerPageOptions: ["5", "10", "15", "20", "25", "30", "50", "100"],
		},
		renderBottomToolbar: ({ table }) => <TableBottomToolbar table={table} />,
	});

	console.log(table.getAllColumns());

	return <MantineReactTable table={table} />;
}
