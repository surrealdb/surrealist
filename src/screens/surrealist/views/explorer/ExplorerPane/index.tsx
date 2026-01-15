import {
	Box,
	Button,
	Center,
	Divider,
	Group,
	Loader,
	Menu,
	ScrollArea,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useDebouncedValue, useInputState } from "@mantine/hooks";
import clsx from "clsx";
import { useContextMenu } from "mantine-contextmenu";
import { type MouseEvent, useEffect, useLayoutEffect, useState } from "react";
import { escapeIdent, RecordId, StringRecordId } from "surrealdb";
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
import { useTables } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { useConfirmation } from "~/providers/Confirmation";
import {
	executeQuery,
	executeQueryFirst,
	getSurrealQL,
} from "~/screens/surrealist/connection/connection";
import { useConfigStore } from "~/stores/config";
import { RecordsChangedEvent } from "~/util/global-events";
import { showInfo } from "~/util/helpers";
import {
	iconChevronDown,
	iconChevronRight,
	iconCopy,
	iconDelete,
	iconFilter,
	iconPlus,
	iconRefresh,
	iconServer,
	iconTable,
} from "~/util/icons";
import { getTableVariant } from "~/util/schema";
import { type SortMode, usePaginationQuery, useRecordQuery } from "./hooks";
import classes from "./style.module.scss";

export interface ExplorerPaneProps {
	activeTable: string;
	onCreateRecord: (table?: string, content?: any) => void;
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

	const [sortMode, setSortMode] = useState<SortMode>(null);

	const [selected, setSelected] = useInputState(new Set<string>());
	const [filter, setFilter] = useInputState("");
	const [filtering, setFiltering] = useState(false);
	const [showFilter] = useDebouncedValue(filtering, 250);
	const [filterClause] = useDebouncedValue(filter, 500);
	const [isFilterValid, setIsFilterValid] = useState(true);

	useEffect(() => {
		let cancelled = false;

		const validate = async () => {
			const result = !showFilter || !filter || !(await getSurrealQL().validateWhere(filter));
			if (!cancelled) {
				setIsFilterValid(result);
			}
		};

		validate();

		return () => {
			cancelled = true;
		};
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

	const selectAllRecords = useStable(async () => {
		let fetchQuery = `SELECT id FROM ${escapeIdent(activeTable)}`;

		if (filter) {
			fetchQuery += ` WHERE ${filter}`;
		}

		if (sortMode) {
			fetchQuery += ` ORDER BY ${sortMode[0]} ${sortMode[1]}`;
		}

		const allRecords = await executeQueryFirst(fetchQuery);
		setSelected(new Set([...allRecords.map((r: any) => r.id.toString())]));
	});

	const invertSelection = useStable(async () => {
		const allRecords = await executeQueryFirst(`SELECT id FROM ${escapeIdent(activeTable)}`);

		const newSelected = allRecords
			.map((it: any) => it.id.toString())
			.filter((it: string) => !selected.has(it));

		setSelected(new Set(newSelected));
	});

	const clearSelection = useStable(() => {
		setSelected(new Set<string>());
	});

	const copySelectedRecords = useStable(() => {
		navigator.clipboard.writeText(Array.from(selected).join("\n"));
	});

	const copySelectedRecordsJSON = useStable(async () => {
		const records = Array.from(selected).map((id) => new StringRecordId(id));
		const result = await executeQueryFirst("SELECT * FROM $records", { records });

		navigator.clipboard.writeText(await getSurrealQL().formatValue(result, true, true));
	});

	const removeRecord = useConfirmation<RecordId>({
		title: "Delete record",
		skippable: true,
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
			await executeQuery(`DELETE ${getSurrealQL().formatValue(id)}`);
			refetch();
		},
	});

	const removeSelectedRecords = useConfirmation({
		title: "Bulk delete records",
		message: `Are you sure you want to delete all ${selected.size} records?`,
		skippable: true,
		onConfirm: async () => {
			const selectedRecords = Array.from(selected).map((it) => new StringRecordId(it));

			await executeQuery("DELETE $selectedRecords", { selectedRecords });

			setSelected(new Set<string>());
			refetch();
		},
	});

	const onRecordContextMenu = useStable((e: MouseEvent, record: any) => {
		if (!(record.id instanceof RecordId) || !connection) return;

		const openQuery = (id: RecordId, prefix: string) => {
			navigateConnection(connection, "query");
			addQueryTab(connection, {
				type: "config",
				query: `${prefix} ${getSurrealQL().formatValue(id)}`,
			});
		};

		showContextMenu([
			{
				key: "duplicate",
				title: "Duplicate record",
				disabled: !allowCreate,
				icon: <Icon path={iconCopy} />,
				onClick: () => {
					onCreateRecord(undefined, record);
				},
			},
			{
				key: "divider-1",
			},
			{
				key: "copy-id",
				title: "Copy Record ID",
				onClick: async () => {
					navigator.clipboard.writeText(await getSurrealQL().formatValue(record.id));

					showInfo({
						title: "Record ID copied",
						subtitle: `Copied ${getSurrealQL().formatValue(record.id)}`,
					});
				},
			},
			{
				key: "copy-json",
				title: "Copy as JSON",
				onClick: async () => {
					navigator.clipboard.writeText(
						await getSurrealQL().formatValue(record, true, true),
					);

					showInfo({
						title: "Record contents copied",
						subtitle: `Copied ${getSurrealQL().formatValue(record.id)}`,
					});
				},
			},
			{
				key: "divider-2",
			},
			{
				key: "select-query",
				title: "Use in SELECT query",
				onClick: () => openQuery(record.id, "SELECT * FROM"),
			},
			{
				key: "update-query",
				title: "Use in UPDATE query",
				onClick: () => openQuery(record.id, "UPDATE"),
			},
			{
				key: "delete-query",
				title: "Use in DELETE query",
				onClick: () => openQuery(record.id, "DELETE"),
			},
			{
				key: "divider-3",
			},
			{
				key: "delete-record",
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

	const onSelectionChangeAll = useStable((values: RecordId[], isSelected: boolean) => {
		const selectedArray = Array.from(selected);

		if (isSelected) {
			const valueMap = values.map((rid) => rid.toString());

			setSelected(new Set([...selectedArray, ...valueMap]));
		} else {
			setSelected(
				new Set(
					selectedArray.filter(
						(id) => !values.some((v: RecordId) => v.toString() === id),
					),
				),
			);
		}
	});

	const onSelectionChange = useStable((record: RecordId, isSelected: boolean) => {
		const selectedArray = Array.from(selected);

		if (isSelected) {
			setSelected(new Set([...selectedArray, record.toString()]));
		} else {
			setSelected(new Set(selectedArray.filter((id) => id !== record.toString())));
		}
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
						{selected.size > 0 && (
							<>
								<Menu
									position="bottom-start"
									trigger="click"
									transitionProps={{
										transition: "scale-y",
									}}
								>
									<Menu.Target>
										<Button
											size="xs"
											color="violet"
											variant="light"
											rightSection={<Icon path={iconChevronDown} />}
										>
											{selected.size} selected
										</Button>
									</Menu.Target>

									<Menu.Dropdown w={150}>
										<Menu.Item onClick={selectAllRecords}>
											Select all records
										</Menu.Item>
										<Menu.Item onClick={invertSelection}>
											Invert selection
										</Menu.Item>
										<Menu.Item onClick={clearSelection}>
											Clear selection
										</Menu.Item>
										<Menu.Divider />
										<Menu.Item onClick={copySelectedRecords}>
											Copy all Record IDs
										</Menu.Item>
										<Menu.Item onClick={copySelectedRecordsJSON}>
											Copy all as JSON
										</Menu.Item>
										<Menu.Divider />
										<Menu.Item
											c="pink.7"
											leftSection={
												<Icon
													color="pink.7"
													path={iconDelete}
												/>
											}
											onClick={removeSelectedRecords}
										>
											Delete records
										</Menu.Item>
									</Menu.Dropdown>
								</Menu>
								<Divider orientation="vertical" />
							</>
						)}

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
			{recordQuery.error ? (
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
								Failed to display records
							</Text>
							<Text>An error occurred while fetching records.</Text>
							<Text
								mt="md"
								c="red"
								ff="monospace"
								maw={500}
							>
								{recordQuery.error.message}
							</Text>
						</Box>
						{allowCreate && (
							<Button
								variant="gradient"
								leftSection={<Icon path={iconRefresh} />}
								onClick={() => recordQuery.refetch()}
								loading={recordQuery.isFetching}
							>
								Try again
							</Button>
						)}
					</Stack>
				</Center>
			) : recordQuery.isPending ? (
				<Center flex={1}>
					<Loader />
				</Center>
			) : records.length > 0 ? (
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
						schema={schema}
						data={records}
						sorting={sortMode}
						selected={selected}
						onSortingChange={setSortMode}
						onSelectionChange={onSelectionChange}
						onSelectionChangeAll={onSelectionChangeAll}
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
