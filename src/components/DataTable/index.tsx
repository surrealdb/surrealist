import { Box, type BoxProps, Checkbox, Group, Text, Tooltip } from "@mantine/core";
import { ScrollArea, Table } from "@mantine/core";
import { alphabetical, isObject } from "radash";
import { type MouseEvent, useMemo } from "react";
import { RecordId } from "surrealdb";
import { useStable } from "~/hooks/stable";
import { useInspector } from "~/providers/Inspector";
import type { ColumnSort, TableInfo } from "~/types";
import { iconChevronDown, iconChevronUp, iconIndex, iconWarning } from "~/util/icons";
import { Icon } from "../Icon";
import { DataCell } from "./datatypes";
import classes from "./style.module.scss";

function isRenderable(value: any) {
	return Array.isArray(value) && value.every((v) => isObject(v));
}

interface DataTableProps extends BoxProps {
	data: any;
	schema?: TableInfo;
	active?: string | null;
	sorting?: ColumnSort | null;
	headers?: string[];
	selected?: Set<string>;
	onSelectionChange?: (id: RecordId, isSelected: boolean) => void;
	onSelectionChangeAll?: (values: RecordId[], isSelected: boolean) => void;
	onSortingChange?: (order: ColumnSort | null) => void;
	onRowContextMenu?: (event: MouseEvent, row: any) => void;
}

export function DataTable(props: DataTableProps) {
	const { inspect } = useInspector();

	const {
		data,
		schema,
		active,
		selected,
		sorting,
		headers,
		onSelectionChange,
		onSelectionChangeAll,
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
		return keys.map((key, i) => {
			const indexed = schema?.indexes.filter((index) => index.cols.includes(key));
			const indexedName = indexed?.map((index) => index.name).join(", ");

			return (
				<Table.Th key={key}>
					<Group
						wrap="nowrap"
						gap="xs"
						style={{
							cursor: "pointer",
							userSelect: "none",
							WebkitUserSelect: "none",
						}}
						onClick={() => handleSortClick(key)}
					>
						<Text
							span
							fw={700}
						>
							{key}
						</Text>
						{indexed && indexedName && (
							<Tooltip label={`This column is indexed by ${indexedName}`}>
								<div>
									<Icon
										path={iconIndex}
										c="slate.3"
									/>
								</div>
							</Tooltip>
						)}
						{sorting?.[0] === key && (
							<Icon
								path={sorting[1] === "asc" ? iconChevronDown : iconChevronUp}
								c="slate.3"
							/>
						)}
					</Group>
				</Table.Th>
			);
		});
	}, [keys, sorting, schema]);

	const recordRows = useMemo(() => {
		return values.map((value, i) => {
			const columns = [...keys].map((key, j) => {
				const cellValue = value[key];

				return (
					<Table.Td
						key={j}
						h={37}
						className={classes.tableValue}
						onClick={() => value.id && inspect(value.id)}
					>
						<DataCell value={cellValue} />
					</Table.Td>
				);
			});

			const isActive = active && value.id === active;

			return (
				<Box
					key={i}
					component="tr"
					onContextMenu={(e) => onRowContextMenu?.(e, value)}
					style={{
						backgroundColor: `${isActive ? "var(--mantine-color-slate-6)" : undefined} !important`,
					}}
				>
					{onSelectionChange && (
						<Table.Td
							h={37}
							w={1}
							style={{ whiteSpace: "nowrap" }}
							className={classes.tableValue}
						>
							<Checkbox
								size="xs"
								checked={selected?.has((value.id as RecordId).toString())}
								styles={{
									input: {
										cursor: "pointer",
									},
									root: {
										width: 16,
									},
								}}
								onChange={(e) => {
									if (!value.id) return;

									onSelectionChange(value.id, e.currentTarget.checked);
								}}
							/>
						</Table.Td>
					)}
					{columns}
				</Box>
			);
		});
	}, [keys, values, active, selected, inspect, onRowContextMenu, onSelectionChange]);

	if (!isRenderable(data)) {
		return <Text c="slate">Result could not be displayed as a table.</Text>;
	}

	return (
		<ScrollArea
			className={classes.root}
			styles={{
				scrollbar: {
					zIndex: 4,
				},
			}}
			scrollbars="xy"
			{...rest}
		>
			<Table className={classes.table}>
				<Table.Thead
					style={{
						position: "sticky",
					}}
				>
					<Table.Tr>
						{onSelectionChangeAll && (
							<Table.Th
								w={1}
								style={{ whiteSpace: "nowrap" }}
							>
								<Checkbox
									size="xs"
									styles={{
										input: {
											cursor: "pointer",
										},
										root: {
											width: 16,
										},
									}}
									indeterminate={
										values.some((v) => selected?.has(v.id.toString())) &&
										!values.every((v) =>
											selected?.has((v.id as RecordId).toString()),
										)
									}
									checked={values.some((v) =>
										selected?.has((v.id as RecordId).toString()),
									)}
									onChange={(e) => {
										onSelectionChangeAll(
											values.map((v) => v.id),
											e.currentTarget.checked,
										);
									}}
								/>
							</Table.Th>
						)}
						{columnHeaders}
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>{recordRows}</Table.Tbody>
			</Table>
			{truncated && (
				<Group
					mt="md"
					mb="xl"
					c="red"
				>
					<Icon path={iconWarning} />
					The rows have been truncated to 100 for performance reasons
				</Group>
			)}
		</ScrollArea>
	);
}
