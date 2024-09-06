import {
	ActionIcon,
	Box,
	Button,
	Center,
	ComboboxData,
	Divider,
	Group,
	ScrollArea,
	Select,
	Text,
	TextInput,
	Tooltip,
} from "@mantine/core";

import {
	FocusEvent,
	KeyboardEvent,
	MouseEvent,
	useLayoutEffect,
	useMemo,
	useState,
} from "react";

import {
	iconChevronLeft,
	iconChevronRight,
	iconCopy,
	iconDelete,
	iconFilter,
	iconJSON,
	iconPlus,
	iconRefresh,
	iconServer,
	iconTable,
} from "~/util/icons";

import { useDebouncedValue, useInputState } from "@mantine/hooks";
import { DataTable } from "~/components/DataTable";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { useEventSubscription } from "~/hooks/event";
import { useStable } from "~/hooks/stable";
import { RecordsChangedEvent } from "~/util/global-events";
import { themeColor } from "~/util/mantine";
import { useContextMenu } from "mantine-contextmenu";
import { useConfigStore } from "~/stores/config";
import { executeQuery } from "~/screens/database/connection/connection";
import { formatValue, validateWhere } from "~/util/surrealql";
import { SortMode, usePaginationQuery, useRecordQuery } from "./hooks";
import { RecordId } from "surrealdb";
import { LoadingContainer } from "~/components/LoadingContainer";

const PAGE_SIZES: ComboboxData = [
	{ label: "10 Results per page", value: "10" },
	{ label: "25 Results per page", value: "25" },
	{ label: "50 Results per page", value: "50" },
	{ label: "100 Results per page", value: "100" },
];

export interface ExplorerPaneProps {
	activeTable: string;
	onCreateRecord: () => void;
}

export function ExplorerPane({
	activeTable,
	onCreateRecord,
}: ExplorerPaneProps) {
	const { addQueryTab, setActiveView } = useConfigStore.getState();
	const { showContextMenu } = useContextMenu();

	const [filtering, setFiltering] = useState(false);
	const [filter, setFilter] = useInputState("");
	const [customPage, setCustomPage] = useInputState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const [sortMode, setSortMode] = useState<SortMode>(null);

	const [showFilter] = useDebouncedValue(filtering, 250);
	const [filterClause] = useDebouncedValue(filter, 500);

	const isFilterValid = useMemo(() => {
		return !showFilter || !filter || !validateWhere(filter);
	}, [showFilter, filter]);

	const recordQuery = useRecordQuery({
		activeTable,
		currentPage,
		pageSize,
		sortMode,
		isFilterValid,
		filter: showFilter ? filterClause : "",
	});

	const paginationQuery = usePaginationQuery({
		activeTable,
		isFilterValid,
		filter: showFilter ? filterClause : "",
	});

	const records: unknown[] = recordQuery.data?.records || [];
	const headers: string[] = recordQuery.data?.headers || [];
	const recordCount: number = paginationQuery.data || 0;
	const pageCount = Math.ceil(recordCount / pageSize);

	const toggleFilter = useStable(() => {
		setFiltering(!filtering);
	});

	const gotoPage = useStable((e: FocusEvent | KeyboardEvent) => {
		if (e.type === "keydown" && (e as KeyboardEvent).key !== "Enter") {
			return;
		}

		let newPage = Number.parseInt(customPage);

		if (!customPage || Number.isNaN(newPage)) {
			setCurrentPage(1);
			setCustomPage("1");
			return;
		}

		if (newPage < 1) {
			newPage = 1;
		}

		if (newPage > pageCount) {
			newPage = pageCount;
		}

		setCurrentPage(newPage);
		setCustomPage(newPage.toString());
	});

	const previousPage = useStable(() => {
		setCurrentPage(p => Math.max(1, p - 1));
	});

	const nextPage = useStable(() => {
		setCurrentPage(p => Math.min(pageCount, p + 1));
	});

	const openCreator = useStable(() => {
		onCreateRecord();
	});

	const refetch = useStable(() => {
		recordQuery.refetch();
		paginationQuery.refetch();
	});

	const onRecordContextMenu = useStable((e: MouseEvent, record: any) => {
		if (!(record.id instanceof RecordId)) return;

		const openQuery = (id: RecordId, prefix: string) => {
			setActiveView("query");
			addQueryTab({
				query: `${prefix} ${formatValue(id)}`,
			});
		};

		showContextMenu([
			{
				key: "copy-id",
				title: "Copy record id",
				icon: <Icon path={iconCopy} />,
				onClick: () => {
					navigator.clipboard.writeText(formatValue(record.id));
				},
			},
			{
				key: "copy-json",
				title: "Copy as JSON",
				icon: <Icon path={iconJSON} />,
				onClick: () => {
					navigator.clipboard.writeText(
						formatValue(record, true, true),
					);
				},
			},
			{
				key: "divider-1",
			},
			{
				key: "select",
				title: "Use in SELECT query",
				onClick: () => openQuery(record.id, "SELECT * FROM"),
			},
			{
				key: "select",
				title: "Use in UPDATE query",
				onClick: () => openQuery(record.id, "UPDATE"),
			},
			{
				key: "select",
				title: "Use in DELETE query",
				onClick: () => openQuery(record.id, "DELETE"),
			},
			{
				key: "divider-2",
			},
			{
				key: "delete",
				title: "Delete record",
				color: "pink.7",
				icon: <Icon path={iconDelete} />,
				onClick: async () => {
					if (!(record.id instanceof RecordId)) return;

					// TODO Use confirmation
					await executeQuery(`DELETE ${formatValue(record.id)}`);

					refetch();
				},
			},
		])(e);
	});

	useLayoutEffect(() => {
		setCurrentPage(1);
		
	}, [activeTable, filterClause]);

	useLayoutEffect(() => {
		setCustomPage(currentPage.toString());
		
	}, [currentPage]);

	useEventSubscription(RecordsChangedEvent, refetch);

	return (
		<ContentPane
			title="Record Explorer"
			icon={iconTable}
			rightSection={
				activeTable && (
					<Group align="center">
						<Tooltip label="New record">
							<ActionIcon
								onClick={openCreator}
								aria-label="Create new record"
							>
								<Icon path={iconPlus} />
							</ActionIcon>
						</Tooltip>

						<Tooltip label="Refresh records">
							<ActionIcon
								onClick={refetch}
								aria-label="Refresh records"
							>
								<Icon path={iconRefresh} />
							</ActionIcon>
						</Tooltip>

						<Tooltip
							label={filtering ? "Hide filter" : "Filter records"}
						>
							<ActionIcon
								onClick={toggleFilter}
								aria-label={
									filtering
										? "Hide filter"
										: "Show record filter"
								}
							>
								<Icon path={iconFilter} />
							</ActionIcon>
						</Tooltip>

						<Divider orientation="vertical" />

						<Icon path={iconServer} mr={-6} />
						<Text lineClamp={1}>
							{recordQuery.isLoading
								? "loading..."
								: `${recordCount || "no"} rows`}
						</Text>
					</Group>
				)
			}
		>
			{filtering && (
				<TextInput
					placeholder="Enter filter clause..."
					leftSection={<Icon path={iconFilter} />}
					value={filter}
					spellCheck={false}
					onChange={setFilter}
					error={!isFilterValid}
					autoFocus
					styles={() => ({
						input: {
							fontFamily: "JetBrains Mono",
							borderColor:
								(isFilterValid
									? undefined
									: themeColor("pink.9")) + " !important",
						},
					})}
				/>
			)}
			{recordQuery.isLoading ? null : records.length > 0 ? (
				<ScrollArea
					style={{
						position: "absolute",
						inset: 12,
						top: filtering ? 40 : 0,
						bottom: 54,
						transition: "top .1s",
					}}
				>
					<DataTable
						data={records}
						sorting={sortMode}
						onSortingChange={setSortMode}
						onRowContextMenu={onRecordContextMenu}
						headers={headers}
					/>

					<LoadingContainer
						visible={recordQuery.isFetching}
					/>
				</ScrollArea>
			) : (
				<Center h="90%">
					<Box ta="center">
						<Text c="slate">This table has no records yet</Text>
						<Button
							mt="xl"
							variant="gradient"
							color="surreal.5"
							leftSection={<Icon path={iconPlus} />}
							onClick={openCreator}
						>
                            Create record
						</Button>
					</Box>
				</Center>
			)}

			<Group
				gap="xs"
				justify="center"
				style={{
					position: "absolute",
					insetInline: 12,
					bottom: 12,
				}}
			>
				<Group gap="xs">
					<ActionIcon
						onClick={previousPage}
						disabled={currentPage <= 1}
						loading={paginationQuery.isLoading}
						aria-label="Previous page"
					>
						<Icon path={iconChevronLeft} />
					</ActionIcon>

					<TextInput
						value={customPage}
						spellCheck={false}
						onChange={setCustomPage}
						maw={36}
						size="xs"
						withAsterisk
						onBlur={gotoPage}
						onKeyDown={gotoPage}
						disabled={paginationQuery.isLoading}
						styles={{
							input: {
								textAlign: "center",
								paddingInline: 0,
							},
						}}
					/>

					<Text c="slate">of {pageCount} pages</Text>

					<ActionIcon
						onClick={nextPage}
						disabled={currentPage >= pageCount}
						loading={paginationQuery.isLoading}
						aria-label="Next page"
					>
						<Icon path={iconChevronRight} />
					</ActionIcon>
				</Group>

				<Select
					value={pageSize.toString()}
					onChange={(v) => setPageSize(Number.parseInt(v!))}
					data={PAGE_SIZES}
					size="xs"
				/>
			</Group>
		</ContentPane>
	);
}
