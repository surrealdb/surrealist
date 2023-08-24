import { useMemo } from 'react';
import { alphabetical, isObject } from 'radash';
import { ActionIcon, Divider, Group, Text } from '@mantine/core';
import { mdiTable, mdiPlus, mdiRefresh, mdiPinOff, mdiPin, mdiDatabase } from '@mdi/js';
import { MRT_ColumnDef, MantineReactTable, useMantineReactTable } from 'mantine-react-table';

import { Icon } from '../Icon';
import { Panel } from '../Panel';
import { OpenFn } from '~/types';
import classes from './style.module.scss';
import { useIsLight } from '~/hooks/theme';
import { renderDataCell } from './datatypes';
import { TableBottomToolbar } from './TableBottomToolbar';
import { ShowHideColumnsButton } from './ShowHideColumnButton';

function isRenderable(value: any) {
	return Array.isArray(value) && value.every((v) => isObject(v));
}

interface DataTableProps {
	data: any;
	active?: string | null;
	openRecord?: OpenFn;
	fetchRecords: () => void;
	createRecord: () => void;
	recordCount: number;
	togglePin: () => void;
	isPinned: boolean;
	pagination: any;
	onPaginationChange: any;
	onRowClick?: (value: any) => void;
}

export function DataTable({
	data,
	active,
	openRecord,
	fetchRecords,
	createRecord,
	recordCount,
	togglePin,
	isPinned,
	pagination,
	onPaginationChange,
	onRowClick,
}: DataTableProps) {
	const isLight = useIsLight();

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
				case 'id': {
					return '00000000000';
				}
				case 'in': {
					return '00000000001';
				}
				case 'out': {
					return '00000000002';
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
		enablePinning: true,
		enableTopToolbar: false,
		enableStickyHeader: true,
		enableBottomToolbar: true,
		enableColumnResizing: true,
		enableColumnDragging: true,
		enableColumnOrdering: true,
		enableRowVirtualization: (recordCount ?? 0) > 100 ? true : false,
		mantineTableContainerProps: {
			className: classes.tableContainer,
			sx: {
				height: 'calc(100% - 64px)', // css hack to size correctly 68 is bottom margin
			},
		},
		mantinePaperProps: {
			sx: {
				width: '100%',
				height: '100%',
				borderRadius: 0,
				boxShadow: 'none',
				position: 'absolute',
				border: 'none !important',
				borderBottomLeftRadius: '0.5rem',
				borderBottomRightRadius: '0.5rem',
			},
		},
		manualPagination: true,
		state: { pagination },
		onPaginationChange: onPaginationChange,
		rowCount: recordCount ?? 0,
		mantinePaginationProps: {
			rowsPerPageOptions: ['5', '10', '25', '30', '50', '100', '250', '500'],
		},
		renderBottomToolbar: ({ table }) => <TableBottomToolbar table={table} />,
	});

	console.log(table.getAllColumns());

	return (
		<Panel
			title="Record Explorer"
			icon={mdiTable}
			padding="0"
			rightSection={
				<Group align="center">
					<ActionIcon title="Create record" onClick={createRecord}>
						<Icon color="light.4" path={mdiPlus} />
					</ActionIcon>

					<ActionIcon title="Refresh" onClick={fetchRecords}>
						<Icon color="light.4" path={mdiRefresh} />
					</ActionIcon>

					<ShowHideColumnsButton table={table} />

					<ActionIcon title={isPinned ? 'Unpin table' : 'Pin table'} onClick={togglePin}>
						<Icon color="light.4" path={isPinned ? mdiPinOff : mdiPin} />
					</ActionIcon>

					<Divider orientation="vertical" color={isLight ? 'light.0' : 'dark.5'} />

					<Icon color="light.4" path={mdiDatabase} mr={-10} />
					<Text color="light.4" lineClamp={1}>
						{recordCount || 'no'} rows
					</Text>
				</Group>
			}>
			<MantineReactTable table={table} />
		</Panel>
	);
}
