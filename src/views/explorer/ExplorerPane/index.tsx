import {
	mdiArrowLeft,
	mdiArrowRight,
	mdiDatabase,
	mdiFilterVariant,
	mdiPlus,
	mdiRefresh,
	mdiTable,
	mdiWrench,
} from "@mdi/js";

import { ActionIcon, Center, Divider, Group, ScrollArea, Select, Text, TextInput } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { ChangeEvent, FocusEvent, KeyboardEvent, useEffect, useMemo } from "react";
import { DataTable } from "~/components/DataTable";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { validate_where_clause } from "~/generated/surrealist-embed";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useExplorerStore } from "~/stores/explorer";
import { getSurreal } from "~/util/surreal";
import { HistoryHandle } from "~/hooks/history";
import { EventBus, useEventSubscription } from "~/hooks/event";
import { useSchema } from "~/hooks/schema";
import { themeColor } from "~/util/mantine";

const PAGE_SIZES = [
	{ label: "10 Results per page", value: "10" },
	{ label: "25 Results per page", value: "25" },
	{ label: "50 Results per page", value: "50" },
	{ label: "100 Results per page", value: "100" },
];

export interface ExplorerPaneProps {
	history: HistoryHandle<any>;
	refreshEvent: EventBus;
}

export function ExplorerPane({ history, refreshEvent }: ExplorerPaneProps) {
	const isLight = useIsLight();
	const schema = useSchema();

	const activeTable = useExplorerStore((s) => s.activeTable);
	const records = useExplorerStore((s) => s.records);
	const recordCount = useExplorerStore((s) => s.recordCount);
	const filtering = useExplorerStore((s) => s.filtering);
	const filter = useExplorerStore((s) => s.filter);
	const isEditing = useExplorerStore((s) => s.isEditing);

	const pageText = useExplorerStore((s) => s.pageText);
	const updatePageText = useExplorerStore((s) => s.updatePageText);

	const pageSize = useExplorerStore((s) => s.pageSize);
	const updatePageSize = useExplorerStore((s) => s.updatePageSize);

	const sortMode = useExplorerStore((s) => s.sortMode);
	const updateSortMode = useExplorerStore((s) => s.updateSortMode);

	const page = useExplorerStore((s) => s.page);
	const updatePage = useExplorerStore((s) => s.updatePage);

	const openEditor = useExplorerStore((s) => s.openEditor);
	const closeEditor = useExplorerStore((s) => s.closeEditor);
	const openCreator = useExplorerStore((s) => s.openCreator);
	const setExplorerFiltering = useExplorerStore((s) => s.setExplorerFiltering);
	const setExplorerFilter = useExplorerStore((s) => s.setExplorerFilter);
	const clearExplorerData = useExplorerStore((s) => s.clearExplorerData);
	const setExplorerData = useExplorerStore((s) => s.setExplorerData);

	const pageCount = Math.ceil(recordCount / Number.parseInt(pageSize));

	const requestCreate = useStable(async () => {
		openCreator(activeTable || '');
		history.clear();
	});

	const toggleInspector = useStable(() => isEditing ? openEditor() : closeEditor());

	function setCurrentPage(number: number) {
		updatePageText(number.toString());
		updatePage(number);
	}

	const toggleFilter = useStable(() => {
		setExplorerFiltering(!filtering);
	});

	const setFilter = useStable((e: ChangeEvent<HTMLInputElement>) => {
		setExplorerFilter(e.target.value);
	});

	const [showFilter] = useDebouncedValue(filtering, 250);
	const [filterClause] = useDebouncedValue(filter, 500);

	const isFilterValid = useMemo(() => {
		return (!showFilter || !filter) || validate_where_clause(filter);
	}, [showFilter, filter]);

	const fetchRecords = useStable(async () => {
		if (!activeTable) {
			clearExplorerData();
			return;
		}

		const surreal = getSurreal();

		if (!surreal || !isFilterValid) {
			return;
		}

		const limitBy = Number.parseInt(pageSize);
		const startAt = (page - 1) * Number.parseInt(pageSize);
		const [sortCol, sortDir] = sortMode || ["id", "asc"];

		let countQuery = `SELECT * FROM count((SELECT * FROM \`${activeTable}\``;
		let fetchQuery = `SELECT * FROM \`${activeTable}\``;

		if (showFilter && filterClause) {
			countQuery += ` WHERE ${filterClause}`;
			fetchQuery += ` WHERE ${filterClause}`;
		}

		countQuery += "))";
		fetchQuery += ` ORDER BY ${sortCol} ${sortDir} LIMIT ${limitBy}`;

		if (startAt > 0) {
			fetchQuery += ` START ${startAt}`;
		}

		const response = await surreal.query(`${countQuery};${fetchQuery}`);
		const count = response[0].result?.[0] || 0;
		const records = response[1].result || [];

		setExplorerData(records, count);

		if (page > pageCount) {
			setCurrentPage(pageCount || 1);
		}
	});

	useEffect(() => {
		fetchRecords();
	}, [activeTable, pageSize, page, sortMode, showFilter, filterClause]);

	useEventSubscription(refreshEvent, () => {
		fetchRecords();
	});

	const gotoPage = useStable((e: FocusEvent | KeyboardEvent) => {
		if (e.type === "keydown" && (e as KeyboardEvent).key !== "Enter") {
			return;
		}

		const value = (e.target as HTMLInputElement).value;
		let newPage = Number.parseInt(value).valueOf();

		if (!value || Number.isNaN(newPage)) {
			updatePageText(page.toString());
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

	const openRecord = useStable((record: any) => {
		const id = typeof record === "string" ? record : record.id;

		history.push(id);
		openEditor();
	});

	const headers = useMemo(() => {
		if (!activeTable) {
			return [];
		}

		return schema?.tables?.find((t) => t.schema.name === activeTable)?.fields?.map((f) => f.name) || [];
	}, []);

	return (
		<ContentPane
			title="Record Explorer"
			icon={mdiTable}
			rightSection={
				<Group align="center">
					<ActionIcon title="Create record" onClick={requestCreate}>
						<Icon color="light.4" path={mdiPlus} />
					</ActionIcon>

					<ActionIcon title="Toggle inspector" onClick={toggleInspector}>
						<Icon color="light.4" path={mdiWrench} />
					</ActionIcon>

					<ActionIcon title="Refresh table" onClick={fetchRecords}>
						<Icon color="light.4" path={mdiRefresh} />
					</ActionIcon>

					<ActionIcon title="Toggle filter" onClick={toggleFilter}>
						<Icon color="light.4" path={mdiFilterVariant} />
					</ActionIcon>

					<Divider orientation="vertical" color={isLight ? "light.0" : "dark.5"} />

					<Icon color="light.4" path={mdiDatabase} mr={-10} />
					<Text c="light.4" lineClamp={1}>
						{recordCount || "no"} rows
					</Text>
				</Group>
			}>
			{activeTable ? (
				<>
					{filtering && (
						<TextInput
							placeholder="Enter filter clause..."
							leftSection={<Icon path={mdiFilterVariant} />}
							value={filter}
							onChange={setFilter}
							error={!isFilterValid}
							autoFocus
							styles={(theme) => ({
								input: {
									fontFamily: "JetBrains Mono",
									borderColor: (isFilterValid ? themeColor("gray") : themeColor("red")) + " !important",
								},
							})}
						/>
					)}
					{records.length > 0 ? (
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
								openRecord={openRecord}
								active={history.current}
								sorting={sortMode}
								onSortingChange={updateSortMode}
								onRowClick={openRecord}
								headers={headers}
							/>
						</ScrollArea>
					) : (
						<Center h="90%" c="light.5">
							Table has no records
						</Center>
					)}

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
							>
								<Icon path={mdiArrowLeft} />
							</ActionIcon>

							<TextInput
								value={pageText}
								onChange={(e) => updatePageText(e.currentTarget.value)}
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

							<Text c="light.3">of {pageCount} pages</Text>

							<ActionIcon
								onClick={nextPage}
								disabled={page >= pageCount}
							>
								<Icon path={mdiArrowRight} />
							</ActionIcon>
						</Group>

						<Select
							value={pageSize}
							onChange={updatePageSize as any}
							data={PAGE_SIZES}
							size="xs"
						/>
					</Group>
				</>
			) : (
				<Center h="100%" c="light.5">
					Select a table to view its records
				</Center>
			)}
		</ContentPane>
	);
}
