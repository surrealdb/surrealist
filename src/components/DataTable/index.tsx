import { Text } from "@mantine/core";
import { useMemo } from "react";
import { OpenFn } from "~/types";
import { alphabetical, isObject } from "radash";
import { MRT_ColumnDef, MantineReactTable, useMantineReactTable } from "mantine-react-table";
import { renderDataCell } from "./datatypes";

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
		const headers: any = [];

		for (const key of keys) {
			headers.push({
				accessorKey: key,
				header: key,
				Cell: ({ cell }: any) => renderDataCell(cell.getValue(), openRecord),
			});
		}

		return headers;
	}, [keys]);

	if (!isRenderable(data)) {
		return <Text color="light.4">Result could not be displayed as a table.</Text>;
	}

	const table = useMantineReactTable({
		columns,
		data: values, //10,000 rows
		enableTopToolbar: false,
		enableColumnResizing: true,
		enableBottomToolbar: true,
		mantineTableProps: { striped: true },
		mantineTableContainerProps: { sx: { height: "calc(100vh - 245px)" } },
		mantinePaperProps: { sx: { border: "none !important", shadow: "none" } },
	});

	return (
		<div style={{ position: "absolute", width: "100%" }}>
			<MantineReactTable table={table} />
		</div>
	);
}
