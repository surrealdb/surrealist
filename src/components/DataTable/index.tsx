import classes from './style.module.scss';
import { Box, Text, useMantineTheme } from "@mantine/core";
import { ScrollArea, Table } from "@mantine/core";
import { useMemo } from "react";
import { renderDataCell } from './datatypes';
import { OpenFn, ColumnSort } from '~/typings';
import { useIsLight } from '~/hooks/theme';
import { useStable } from '~/hooks/stable';
import { Icon } from '../Icon';
import { mdiChevronDown, mdiChevronUp } from '@mdi/js';
import { isObject } from 'radash';

function isRenderable(value: any) {
	return Array.isArray(value) && value.every(v => isObject(v));
}

interface DataTableProps {
	data: any;
	active?: string | null;
	sorting?: ColumnSort | null;
	openRecord?: OpenFn;
	onSortingChange?: (order: ColumnSort | null) => void;
}

export function DataTable({ data, active, sorting, openRecord, onSortingChange }: DataTableProps) {
	const theme = useMantineTheme();
	const isLight = useIsLight();

	const handleSortClick = useStable((col: string) => {
		if (!onSortingChange) return;

		const [column, direction] = sorting || [];

		if (column === col && direction === 'asc') {
			onSortingChange([col, 'desc']);
		} else if (column === col && direction === 'desc') {
			onSortingChange(null);
		} else {
			onSortingChange([col, 'asc']);
		}
	});
	
	const [keys, values] = useMemo(() => {
		const keys: string[] = [];
		const values: any[] = [];
	
		if (isRenderable(data)) {
			for (let i = 0; i < data.length; i++) {
				const row: any = {};

				Object.entries(data[i]).forEach(([key, value]) => {
					if (!keys.includes(key)) {
						if (key === 'id') {
							keys.unshift(key);
						} else {
							keys.push(key);
						}
					}

					row[key] = value;
				});

				values.push(row);
			}
		}

		return [keys, values];
	}, [data, active]);
	
	const headers = useMemo(() => {
		const headers: any = [];

		keys.forEach(key => {
			headers.push(
				<Box
					key={key}
					component="th"
					bg={isLight ? 'white' : 'dark.7'}
				>
					<Text
						span
						onClick={() => handleSortClick(key)}
						style={{
							cursor: onSortingChange ? 'pointer' : undefined,
							userSelect: 'none',
							WebkitUserSelect: 'none'
						}}
					>
						{key}
						{sorting?.[0] == key && (
							<Icon
								path={sorting[1] == 'asc' ? mdiChevronDown : mdiChevronUp}
								pos="absolute"
							/>
						)}
					</Text>
				</Box>
			);
		});
		
		return headers;
	}, [isLight, keys, sorting]);

	const activeColor = useMemo(() => {
		return theme.fn.rgba(theme.fn.themeColor('light.6'), isLight ? 0.15 : 0.4);
	}, [isLight]);

	const rows = useMemo(() => {
		return values.map((value, i) => {
			const columns = Array.from(keys).map((key, j) => {
				const cellValue = value[key];

				return (
					<Box
						key={j}
						component="td"
						className={classes.tableValue}
						h={37}
					>
						{renderDataCell(cellValue, openRecord)}
					</Box>
				);
			});

			const isActive = value.id == active;

			return (
				<Box
					key={i}
					component="tr"
					sx={{
						backgroundColor: `${isActive ? activeColor : undefined} !important`,
					}}
				>
					{columns}
				</Box>
			)
		});
	}, [keys, values, isLight]);

	if (!isRenderable(data)) {
		return (
			<Text color="light.4">
				Result could not be displayed as a table.
			</Text>
		);
	}

	return (
		<div className={classes.tableContainer}>
			<ScrollArea className={classes.tableWrapper}>
				<Table
					striped
					className={classes.table}
				>
					<thead>
						<tr>
							{headers}
						</tr>
					</thead>
					<tbody>
						{rows}
					</tbody>
				</Table>
			</ScrollArea>
		</div>
	)
}