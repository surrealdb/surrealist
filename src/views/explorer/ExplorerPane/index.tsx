import { ActionIcon, Box, Button, Center, ComboboxData, Divider, Group, ScrollArea, Select, Text, TextInput, Tooltip } from "@mantine/core";
import { useDebouncedValue, useInputState } from "@mantine/hooks";
import { FocusEvent, KeyboardEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import { DataTable } from "~/components/DataTable";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { useEventSubscription } from "~/hooks/event";
import { useStable } from "~/hooks/stable";
import { useSchema } from "~/hooks/schema";
import { RecordsChangedEvent } from "~/util/global-events";
import { themeColor } from "~/util/mantine";
import { iconChevronLeft, iconChevronRight, iconCopy, iconDelete, iconFilter, iconJSON, iconPlus, iconRefresh, iconServer, iconTable } from "~/util/icons";
import { useContextMenu } from "mantine-contextmenu";
import { useConfigStore } from "~/stores/config";
import { executeQuery } from "~/connection";
import { formatValue, validateWhere } from "~/util/surrealql";
import { RecordId } from "surrealdb.js";
import { tb } from "~/util/helpers";
import { useQuery } from '@tanstack/react-query';

const PAGE_SIZES: ComboboxData = [
	{ label: "10 Results per page", value: "10" },
	{ label: "25 Results per page", value: "25" },
	{ label: "50 Results per page", value: "50" },
	{ label: "100 Results per page", value: "100" },
];

type SortMode = [string, "asc" | "desc"] | null;

type FetchRecordsInput = {
	activeTable: string;
	page: number;
	pageSize: number;
	sortMode: SortMode;
	showFilter: boolean;
	filterClause: string;
};

const fetchRecords = async (input: FetchRecordsInput) : Promise<{ records: unknown[], total: number }> => {
	const { activeTable, page, pageSize, sortMode, showFilter, filterClause } = input;

	if (!activeTable) {
		return { records: [], total: 0 };
	}

	try {
		const isFilterValid = (!showFilter || !filterClause) || !validateWhere(filterClause);

		if (!isFilterValid) {
			throw new Error("Invalid filter clause");
		}

		const limitBy = pageSize;
		const startAt = (page - 1) * pageSize;
		const [sortCol, sortDir] = sortMode || ["id", "asc"];
		let countQuery = `SELECT count() AS count FROM ${tb(activeTable)}`;
		let fetchQuery = `SELECT * FROM ${tb(activeTable)}`;

		if (showFilter && filterClause) {
			countQuery += ` WHERE ${filterClause}`;
			fetchQuery += ` WHERE ${filterClause}`;
		}

		countQuery += " GROUP ALL";
		fetchQuery += ` ORDER BY ${sortCol} ${sortDir} LIMIT ${limitBy}`;

		if (startAt > 0) {
			fetchQuery += ` START ${startAt}`;
		}

		const response = await executeQuery(`${countQuery};${fetchQuery}`);
		const total = response[0].result?.[0]?.count || 0;
		const records = response[1].result || [];

		return { records, total };
	} catch {
		return { records: [], total: 0 };
	}
};

export interface ExplorerPaneProps {
	activeTable: string;
	onCreateRecord: () => void;
}

export function ExplorerPane({ activeTable, onCreateRecord }: ExplorerPaneProps) {
	const { addQueryTab, setActiveView } = useConfigStore.getState();
	const { showContextMenu } = useContextMenu();

	const schema = useSchema();

	const [filtering, setFiltering] = useState(false);
	const [filter, setFilter] = useInputState("");
	const [pageText, setPageText] = useInputState("1");
	const [pageSizeStr, setPageSizeStr] = useState("25");
	const [sortMode, setSortMode] = useState<SortMode>(null);
	const [page, setPage] = useState(1);

	const [showFilter] = useDebouncedValue(filtering, 250);
	const [filterClause] = useDebouncedValue(filter, 500);

	const isFilterValid = useMemo(() => {
		return (!showFilter || !filter) || !validateWhere(filter);
	}, [showFilter, filter]);

	const pageSize = Number.parseInt(pageSizeStr);

	const queryInput: FetchRecordsInput = {
		activeTable,
		page,
		pageSize,
		sortMode,
		showFilter,
		filterClause,
	};

	const { isLoading, data, refetch } = useQuery({
		queryKey: ['explorer', 'records', queryInput],
		queryFn: () => fetchRecords(queryInput)
	});

	const refreshRecords = () => {
		refetch();
	};

	const records: unknown[] = data?.records || [];
	const recordCount: number = data?.total || 0;

	const pageCount = Math.ceil(recordCount / pageSize);

	const setCurrentPage = useStable((number: number) => {
		setPageText(number.toString());
		setPage(number);
	});

	const toggleFilter = useStable(() => {
		setFiltering(!filtering);
	});

	useEffect(() => {
		if (page > pageCount) {
			setCurrentPage(pageCount || 1);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page, pageCount]);

	useEventSubscription(RecordsChangedEvent, () => {
		refreshRecords();
	});

	const gotoPage = useStable((e: FocusEvent | KeyboardEvent) => {
		if (e.type === "keydown" && (e as KeyboardEvent).key !== "Enter") {
			return;
		}

		const value = (e.target as HTMLInputElement).value;
		let newPage = Number.parseInt(value).valueOf();

		if (!value || Number.isNaN(newPage)) {
			setPageText(page.toString());
			return;
		}

		if (newPage < 1) {
			newPage = 1;
		}

		if (newPage > pageCount) {
			newPage = pageCount;
		}

		setCurrentPage(newPage);
	});

	const previousPage = useStable(() => {
		if (page <= 1) return;

		setCurrentPage(page - 1);
	});

	const nextPage = useStable(() => {
		if (page >= pageCount) return;

		setCurrentPage(page + 1);
	});

	const openCreator = useStable(() => {
		onCreateRecord();
	});

	const openRecordQuery = (id: RecordId, prefix: string) => {
		setActiveView("query");
		addQueryTab({
			query: `${prefix} ${formatValue(id)}`
		});
	};

	const onRecordContextMenu = useStable((e: MouseEvent, record: any) => {
		if (!(record.id instanceof RecordId)) return;

		showContextMenu([
			{
				key: "copy",
				title: "Copy record id",
				icon: <Icon path={iconCopy} />,
				onClick: () => {
					navigator.clipboard.writeText(formatValue(record.id));
				}
			},
			{
				key: "copy",
				title: "Copy as JSON",
				icon: <Icon path={iconJSON} />,
				onClick: () => {
					navigator.clipboard.writeText(formatValue(record, true, true));
				}
			},
			{
				key: "divider-1"
			},
			{
				key: "select",
				title: "Use in SELECT query",
				onClick: () => openRecordQuery(record.id, 'SELECT * FROM')
			},
			{
				key: "select",
				title: "Use in UPDATE query",
				onClick: () => openRecordQuery(record.id, 'UPDATE')
			},
			{
				key: "select",
				title: "Use in DELETE query",
				onClick: () => openRecordQuery(record.id, 'DELETE')
			},
			{
				key: "divider-2"
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

					refreshRecords();
				}
			},
		])(e);
	});

	const headers = schema?.tables?.find((t) => t.schema.name === activeTable)?.fields?.map((f) => f.name) || [];

	return (
		<ContentPane
			title="Record Explorer"
			loading={isLoading}
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
								onClick={refreshRecords}
								aria-label="Refresh records"
							>
								<Icon path={iconRefresh} />
							</ActionIcon>
						</Tooltip>

						<Tooltip label={filtering ? "Hide filter" : "Filter records"}>
							<ActionIcon
								onClick={toggleFilter}
								aria-label={filtering ? "Hide filter" : "Show record filter"}
							>
								<Icon path={iconFilter} />
							</ActionIcon>
						</Tooltip>

						<Divider orientation="vertical" />

						<Icon path={iconServer} mr={-6} />
						<Text lineClamp={1}>
							{isLoading ? "loading..." : `${recordCount || "no"} rows`}
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
							borderColor: (isFilterValid ? undefined : themeColor("pink.9")) + " !important",
						},
					})}
				/>
			)}
			{isLoading ?
				null
				:
				records.length > 0 ? (
					<ScrollArea
						style={{
							position: "absolute",
							inset: 12,
							top: filtering ? 40 : 0,
							bottom: 54,
							transition: "top .1s"
						}}
					>
						<DataTable
							data={records}
							sorting={sortMode}
							onSortingChange={setSortMode}
							onRowContextMenu={onRecordContextMenu}
							headers={headers}
						/>
					</ScrollArea>
				) : (
					<Center h="90%">
						<Box ta="center">
							<Text c="slate">
							This table has no records yet
							</Text>
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
				)
			}

			<Group
				gap="xs"
				justify="center"
				style={{
					position: "absolute",
					insetInline: 12,
					bottom: 12
				}}
			>
				<Group gap="xs">
					<ActionIcon
						onClick={previousPage}
						disabled={page <= 1}
						aria-label="Previous page"
					>
						<Icon path={iconChevronLeft} />
					</ActionIcon>

					<TextInput
						value={pageText}
						spellCheck={false}
						onChange={setPageText}
						maw={36}
						size="xs"
						withAsterisk
						onBlur={gotoPage}
						onKeyDown={gotoPage}
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
						disabled={page >= pageCount}
						aria-label="Next page"
					>
						<Icon path={iconChevronRight} />
					</ActionIcon>
				</Group>

				<Select
					value={pageSizeStr}
					onChange={setPageSizeStr as any}
					data={PAGE_SIZES}
					size="xs"
				/>
			</Group>
		</ContentPane>
	);
}
