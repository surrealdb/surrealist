import { useMemo, useState } from "react";
import { Button, Divider, Flex, Menu } from "@mantine/core";
import {
	MRT_Column,
	MRT_ShowHideColumnsMenuItems,
	MRT_TableInstance,
	getDefaultColumnOrderIds,
} from "mantine-react-table";
import { useIsLight } from "~/hooks/theme";

interface Props<TData extends Record<string, any> = {}> {
	isSubMenu?: boolean;
	table: MRT_TableInstance<TData>;
}

export const ShowHideColumnsMenu = <TData extends Record<string, any> = {}>({ isSubMenu, table }: Props<TData>) => {
	const isLight = useIsLight();
	const {
		getAllColumns,
		getAllLeafColumns,
		getCenterLeafColumns,
		getIsAllColumnsVisible,
		getIsSomeColumnsPinned,
		getIsSomeColumnsVisible,
		getLeftLeafColumns,
		getRightLeafColumns,
		getState,
		toggleAllColumnsVisible,
		options: { enableColumnOrdering, enableHiding, enablePinning, localization },
	} = table;
	const { columnOrder, columnPinning } = getState();

	const hideAllColumns = () => {
		getAllLeafColumns()
			.filter((col) => col.columnDef.enableHiding !== false)
			.forEach((col) => col.toggleVisibility(false));
	};

	const allColumns = useMemo(() => {
		const columns = getAllColumns();
		if (columnOrder.length > 0 && !columns.some((col) => col.columnDef.columnDefType === "group")) {
			return [
				...getLeftLeafColumns(),
				...Array.from(new Set(columnOrder)).map((colId) => getCenterLeafColumns().find((col) => col?.id === colId)),
				...getRightLeafColumns(),
			].filter(Boolean);
		}
		return columns;
	}, [
		columnOrder,
		columnPinning,
		getAllColumns(),
		getCenterLeafColumns(),
		getLeftLeafColumns(),
		getRightLeafColumns(),
	]) as MRT_Column<TData>[];

	const [hoveredColumn, setHoveredColumn] = useState<MRT_Column<TData> | null>(null);

	return (
		<Menu.Dropdown
			sx={{
				maxHeight: "calc(80vh - 100px)",
				overflowY: "auto",
			}}>
			<Flex
				sx={{
					justifyContent: isSubMenu ? "center" : "space-between",
					padding: "8px",
					gap: "8px",
				}}>
				{!isSubMenu && enableHiding && (
					<Button disabled={!getIsSomeColumnsVisible()} onClick={hideAllColumns} variant="subtle">
						{localization.hideAll}
					</Button>
				)}
				{!isSubMenu && enableColumnOrdering && (
					<Button onClick={() => table.setColumnOrder(getDefaultColumnOrderIds(table.options as any))} variant="subtle">
						{localization.resetOrder}
					</Button>
				)}
				{!isSubMenu && enablePinning && (
					<Button disabled={!getIsSomeColumnsPinned()} onClick={() => table.resetColumnPinning(true)} variant="subtle">
						{localization.unpinAll}
					</Button>
				)}
				{enableHiding && (
					<Button disabled={getIsAllColumnsVisible()} onClick={() => toggleAllColumnsVisible(true)} variant="subtle">
						{localization.showAll}
					</Button>
				)}
			</Flex>
			<Divider style={{ paddingBottom: "4px" }} color={isLight ? "light.0" : "dark.5"} />
			{allColumns.map((column, index) => (
				<MRT_ShowHideColumnsMenuItems
					allColumns={allColumns}
					column={column}
					hoveredColumn={hoveredColumn}
					isSubMenu={isSubMenu}
					key={`${index}-${column.id}`}
					setHoveredColumn={setHoveredColumn}
					table={table}
				/>
			))}
		</Menu.Dropdown>
	);
};
