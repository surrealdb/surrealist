import {
	ActionIcon,
	Box,
	Button,
	Center,
	Divider,
	Group,
	ScrollArea,
	Text,
	TextInput,
	Tooltip,
} from "@mantine/core";

import { type MouseEvent, useLayoutEffect, useMemo, useState } from "react";

import {
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
import { useContextMenu } from "mantine-contextmenu";
import { RecordId } from "surrealdb";
import { ActionButton } from "~/components/ActionButton";
import { DataTable } from "~/components/DataTable";
import { Icon } from "~/components/Icon";
import { LoadingContainer } from "~/components/LoadingContainer";
import { Pagination } from "~/components/Pagination";
import { usePagination } from "~/components/Pagination/hook";
import { ContentPane } from "~/components/Pane";
import { RecordLink } from "~/components/RecordLink";
import { useActiveConnection } from "~/hooks/connection";
import { useEventSubscription } from "~/hooks/event";
import { useStable } from "~/hooks/stable";
import { useConfirmation } from "~/providers/Confirmation";
import { executeQuery } from "~/screens/database/connection/connection";
import { useConfigStore } from "~/stores/config";
import { RecordsChangedEvent } from "~/util/global-events";
import { themeColor } from "~/util/mantine";
import { formatValue, validateWhere } from "~/util/surrealql";
import { type SortMode, usePaginationQuery, useRecordQuery } from "./hooks";
import { useActiveView } from "~/hooks/routing";

export interface ExplorerPaneProps {
	activeTable: string;
	onCreateRecord: () => void;
}

export function ExplorerPane({ activeTable, onCreateRecord }: ExplorerPaneProps) {
	const { addQueryTab, updateCurrentConnection } = useConfigStore.getState();
	const { showContextMenu } = useContextMenu();
	const connection = useActiveConnection();
	const pagination = usePagination();
	const [, setActiveView] = useActiveView();

	const [filtering, setFiltering] = useState(false);
	const [filter, setFilter] = useInputState("");
	const [sortMode, setSortMode] = useState<SortMode>(null);

	const [showFilter] = useDebouncedValue(filtering, 250);
	const [filterClause] = useDebouncedValue(filter, 500);

	const isFilterValid = useMemo(() => {
		return !showFilter || !filter || !validateWhere(filter);
	}, [showFilter, filter]);

	const recordQuery = useRecordQuery({
		activeTable,
		currentPage: pagination.currentPage,
		pageSize: pagination.pageSize,
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

	const toggleFilter = useStable(() => {
		setFiltering(!filtering);
	});

	const openCreator = useStable(() => {
		onCreateRecord();
	});

	const openTableList = useStable(() => {
		updateCurrentConnection({
			explorerTableList: true,
		});
	});

	const refetch = useStable(() => {
		recordQuery.refetch();
		paginationQuery.refetch();
	});

	const removeRecord = useConfirmation<RecordId>({
		title: "Delete record",
		message: (value) => (
			<Box>
				Are you sure you want to delete this record?
				<RecordLink
					mt="sm"
					value={value}
					withOpen={false}
				/>
			</Box>
		),
		onConfirm: async (id) => {
			await executeQuery(`DELETE ${formatValue(id)}`);
			refetch();
		},
	});

	const onRecordContextMenu = useStable((e: MouseEvent, record: any) => {
		if (!(record.id instanceof RecordId)) return;

		const openQuery = (id: RecordId, prefix: string) => {
			setActiveView("query");
			addQueryTab({
				type: "config",
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
					navigator.clipboard.writeText(formatValue(record, true, true));
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
					if (record.id instanceof RecordId) {
						removeRecord(record.id);
					}
				},
			},
		])(e);
	});

	useLayoutEffect(() => {
		pagination.setTotal(recordCount);
	}, [pagination.setTotal, recordCount]);

	useEventSubscription(RecordsChangedEvent, refetch);

	return (
		<ContentPane
			title="Record Explorer"
			icon={iconTable}
			leftSection={
				!connection.explorerTableList && (
					<ActionButton
						label="Reveal tables"
						mr="sm"
						color="slate"
						variant="light"
						onClick={openTableList}
						aria-label="Reveal tables"
					>
						<Icon path={iconChevronRight} />
					</ActionButton>
				)
			}
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

						<Tooltip label={filtering ? "Hide filter" : "Filter records"}>
							<ActionIcon
								onClick={toggleFilter}
								aria-label={filtering ? "Hide filter" : "Show record filter"}
							>
								<Icon path={iconFilter} />
							</ActionIcon>
						</Tooltip>

						<Divider orientation="vertical" />

						<Icon
							path={iconServer}
							mr={-6}
						/>
						<Text lineClamp={1}>
							{recordQuery.isLoading ? "loading..." : `${recordCount || "no"} rows`}
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
							borderColor: `${isFilterValid ? undefined : themeColor("pink.9")} !important`,
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

					<LoadingContainer visible={recordQuery.isFetching} />
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
				<Pagination
					store={pagination}
					loading={recordQuery.isLoading}
				/>
			</Group>
		</ContentPane>
	);
}
