import { ActionIcon, Flex, Select, type Sx } from "@mantine/core";
import { MRT_TableInstance } from "mantine-react-table";

interface Props<TData extends Record<string, any> = {}> {
	table: MRT_TableInstance<TData>;
}

const commonActionButtonStyles: Sx = {
	userSelect: "none",
	"&:disabled": {
		backgroundColor: "transparent",
		border: "none",
	},
};

export const TablePagination = <TData extends Record<string, any> = {}>({ table }: Props<TData>) => {
	const {
		getPrePaginationRowModel,
		getState,
		setPageIndex,
		setPageSize,
		options: {
			icons: { IconChevronLeftPipe, IconChevronRightPipe, IconChevronLeft, IconChevronRight },
			localization,
			mantinePaginationProps,
			rowCount,
		},
	} = table;

	const {
		pagination: { pageSize = 10, pageIndex = 0 },
	} = getState();

	const paginationProps =
		mantinePaginationProps instanceof Function ? mantinePaginationProps({ table }) : mantinePaginationProps;

	const totalRowCount = rowCount ?? getPrePaginationRowModel().rows.length;
	const numberOfPages = Math.ceil(totalRowCount / pageSize);
	const lastRowIndex = Math.min(pageIndex * pageSize + pageSize, totalRowCount);

	return (
		<Flex align="center" justify="space-between" gap="md" py="sm" px="sm" p="relative" sx={{ zIndex: 2 }}>
			<Select
				data={paginationProps?.rowsPerPageOptions ?? ["5", "10", "15", "20", "25", "30", "50", "100"]}
				label={localization.rowsPerPage}
				onChange={(value: string) => setPageSize(+value)}
				value={pageSize.toString()}
				sx={{
					"@media (min-width: 720px)": {
						display: "flex",
						alignItems: "center",
						gap: "8px",
					},
					"& .mantine-Select-input": {
						width: "80px",
					},
				}}
				withinPortal
			/>
			<ActionIcon
				aria-label={localization.goToFirstPage}
				disabled={pageIndex <= 0}
				onClick={() => setPageIndex(0)}
				sx={commonActionButtonStyles}>
				<IconChevronLeftPipe />
			</ActionIcon>
			<ActionIcon
				aria-label={localization.goToPreviousPage}
				disabled={pageIndex <= 0}
				onClick={() => setPageIndex(pageIndex - 1)}
				sx={commonActionButtonStyles}>
				<IconChevronLeft />
			</ActionIcon>
			<ActionIcon
				aria-label={localization.goToNextPage}
				disabled={lastRowIndex >= totalRowCount}
				onClick={() => setPageIndex(pageIndex + 1)}
				sx={commonActionButtonStyles}>
				<IconChevronRight />
			</ActionIcon>
			<ActionIcon
				aria-label={localization.goToLastPage}
				disabled={lastRowIndex >= totalRowCount}
				onClick={() => setPageIndex(numberOfPages - 1)}
				sx={commonActionButtonStyles}>
				<IconChevronRightPipe />
			</ActionIcon>
		</Flex>
	);
};
