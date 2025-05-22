import classes from "./style.module.scss";

import {
	Box,
	Button,
	Center,
	Divider,
	Group,
	ScrollArea,
	Stack,
	Text,
	TextInput,
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
import clsx from "clsx";
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
import { useConnection } from "~/hooks/connection";
import { useEventSubscription } from "~/hooks/event";
import { useConnectionAndView, useConnectionNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useConfirmation } from "~/providers/Confirmation";
import { executeQuery } from "~/screens/surrealist/connection/connection";
import { useConfigStore } from "~/stores/config";
import { RecordsChangedEvent } from "~/util/global-events";
import { formatValue, validateWhere } from "~/util/surrealql";
import { type SortMode, usePaginationQuery, useRecordQuery } from "./hooks";
import { useTables } from "~/hooks/schema";
import { getTableVariant } from "~/util/schema";

export interface ExplorerPaneProps {
	activeTable: string;
	onCreateRecord: () => void;
}

export function ExplorerPane({ activeTable, onCreateRecord }: ExplorerPaneProps) {
	const { addQueryTab, updateConnection } = useConfigStore.getState();
	const { showContextMenu } = useContextMenu();
	const explorerTableList = useConnection((c) => c?.explorerTableList);
	const pagination = usePagination();
	const [connection] = useConnectionAndView();
	const navigateConnection = useConnectionNavigator();
	const schema = useTables().find((t) => t.schema.name === activeTable);

	const allowCreate = schema && getTableVariant(schema) !== "view";

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
		if (!connection) return;

		updateConnection({
			id: connection,
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
		if (!(record.id instanceof RecordId) || !connection) return;

		const openQuery = (id: RecordId, prefix: string) => {
			navigateConnection(connection, "query");
			addQueryTab(connection, {
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: Reset to page 1 when switching tables
	useLayoutEffect(() => {
		pagination.setCurrentPage(1);
	}, [pagination.setCurrentPage, activeTable]);

	useEventSubscription(RecordsChangedEvent, refetch);

	return (
		<ContentPane
			title="Record Explorer"
			icon={iconTable}
			leftSection={
				!explorerTableList && (
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
						{allowCreate && (
							<ActionButton
								onClick={openCreator}
								label="Create record"
							>
								<Icon path={iconPlus} />
							</ActionButton>
						)}

						<ActionButton
							onClick={refetch}
							label="Refresh records"
						>
							<Icon path={iconRefresh} />
						</ActionButton>

						<ActionButton
							onClick={toggleFilter}
							label={filtering ? "Hide filter" : "Filter records"}
						>
							<Icon path={iconFilter} />
						</ActionButton>

						<Divider orientation="vertical" />

						<Icon
							path={iconServer}
							mr={-6}
						/>
						<Text lineClamp={1}>
							{recordQuery.isLoading
								? "loading..."
								: `${recordCount.toLocaleString() || "no"} rows`}
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
					autoFocus
					className={clsx(!isFilterValid && classes.filterInvalid)}
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
				<Center flex={1}>
					<Stack
						align="center"
						justify="center"
						gap="xl"
					>
						<Box ta="center">
							<Text
								fz="lg"
								fw={600}
								c="bright"
							>
								No records found
							</Text>
							<Text>This table contains no records</Text>
						</Box>
						{allowCreate && (
							<Button
								variant="gradient"
								leftSection={<Icon path={iconPlus} />}
								onClick={openCreator}
							>
								Create record
							</Button>
						)}
					</Stack>
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
