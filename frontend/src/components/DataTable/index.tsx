import classes from './style.module.scss';
import { Text } from "@mantine/core";
import { ScrollArea, Table } from "@mantine/core";
import { useMemo } from "react";
import { propertyVisitor } from "~/util/visitor";

interface DataTableProps {
	data: any;
}

export function DataTable({ data }: DataTableProps) {
	const [keys, values] = useMemo(() => {
		const keys: string[] = [];
		const values: any[] = [];
	
		if (Array.isArray(data)) {
			for (let i = 0; i < data.length; i++) {
				const row: any = {};
				
				propertyVisitor(data[i], (path, value) => {
					const pathName = path.join('.');
			
					if (!keys.includes(pathName)) {
						if (pathName === 'id') {
							keys.unshift(pathName);
						} else {
							keys.push(pathName);
						}
					}

					row[pathName] = value;
				});

				values.push(row);
			}
		}

		return [keys, values];
	}, [data]);

	const headers = useMemo(() => {
		const headers: any = [];

		keys.forEach(key => {
			headers.push(
				<th>{key}</th>
			);
		});
		
		return headers;
	}, [keys]);

	const rows = useMemo(() => {
		return values.map(value => {
			let hasId = false;

			const columns = Array.from(keys).map(key => {
				const text = value[key];

				if (!hasId) {
					hasId = true;

					return (
						<td>
							<Text c="surreal" ff="JetBrains Mono">
								{text}
							</Text>
						</td>
					);
				}

				if (text !== undefined) {
					return (
						<td className={classes.tableValue}>
							{text.toString()}
						</td>
					);
				} else {
					return (
						<td>
							<Text size="sm" color="light.5">
								&mdash;
							</Text>
						</td>
					);
				}
			});

			return (
				<tr>
					{columns}
				</tr>
			)
		});
	}, [keys, values]);

	if (!Array.isArray(data)) {
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