import { Box, Flex, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
	MRT_ProgressBar,
	MRT_TableInstance,
	MRT_ToolbarAlertBanner,
	MRT_ToolbarDropZone,
	commonToolbarStyles,
} from "mantine-react-table";
import { TablePagination } from "./TablePagination";

interface Props<TData extends Record<string, any> = {}> {
	table: MRT_TableInstance<TData>;
}

export const TableBottomToolbar = <TData extends Record<string, any> = {}>({ table }: Props<TData>) => {
	const {
		getState,
		getPrePaginationRowModel,

		options: {
			mantineBottomToolbarProps,
			positionToolbarAlertBanner,
			positionToolbarDropZone,
			localization,
			renderBottomToolbarCustomActions,
			rowCount,
		},
		refs: { bottomToolbarRef },
	} = table;

	const {
		pagination: { pageSize = 10, pageIndex = 0 },
	} = getState();

	const { isFullScreen } = getState();

	const isMobile = useMediaQuery("(max-width: 720px)");

	const toolbarProps =
		mantineBottomToolbarProps instanceof Function ? mantineBottomToolbarProps({ table }) : mantineBottomToolbarProps;

	const stackAlertBanner = isMobile || !!renderBottomToolbarCustomActions;

	const totalRowCount = rowCount ?? getPrePaginationRowModel().rows.length;
	const firstRowIndex = pageIndex * pageSize;
	const lastRowIndex = Math.min(pageIndex * pageSize + pageSize, totalRowCount);
	return (
		<Box
			{...toolbarProps}
			ref={(node: HTMLDivElement) => {
				if (node) {
					bottomToolbarRef.current = node;
					if (toolbarProps?.ref) {
						toolbarProps.ref.current = node;
					}
				}
			}}
			sx={(theme) => ({
				...commonToolbarStyles({ theme }),
				bottom: isFullScreen ? "0" : undefined,
				boxShadow: `0 1px 2px -1px ${theme.fn.rgba(theme.black, 0.1)} inset`,
				left: 0,
				position: isFullScreen ? "fixed" : "relative",
				right: 0,
				...(toolbarProps?.sx instanceof Function ? toolbarProps.sx(theme) : (toolbarProps?.sx as any)),
			})}>
			<MRT_ProgressBar isTopToolbar={false} table={table} />
			{positionToolbarAlertBanner === "bottom" && (
				<MRT_ToolbarAlertBanner stackAlertBanner={stackAlertBanner} table={table} />
			)}
			{["both", "bottom"].includes(positionToolbarDropZone ?? "") && <MRT_ToolbarDropZone table={table} />}
			<Flex
				sx={{
					alignItems: "center",
					boxSizing: "border-box",
					display: "flex",
					justifyContent: "space-between",
					padding: "0.75rem",
					paddingTop: 0,
					width: "100%",
				}}>
				<Text px="0.75rem">{`${
					lastRowIndex === 0 ? 0 : (firstRowIndex + 1).toLocaleString()
				}-${lastRowIndex.toLocaleString()} ${localization.of} ${totalRowCount.toLocaleString()}`}</Text>
				<span />
				<Box
					sx={{
						display: "flex",
						justifyContent: "flex-end",
						position: stackAlertBanner ? "relative" : "relative",
						right: 0,
						top: 0,
					}}>
					<TablePagination table={table} />
				</Box>
			</Flex>
		</Box>
	);
};
