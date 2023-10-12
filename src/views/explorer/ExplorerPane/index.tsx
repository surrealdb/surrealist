import {
	mdiArrowLeft,
	mdiArrowRight,
	mdiDatabase,
	mdiFilterVariant,
	mdiPin,
	mdiPinOff,
	mdiPlus,
	mdiRefresh,
	mdiTable,
} from "@mdi/js";

import { ActionIcon, Button, Center, Divider, Group, ScrollArea, Select, Text, TextInput } from "@mantine/core";
import { useDebouncedValue, useInputState } from "@mantine/hooks";
import { ChangeEvent, FocusEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";
import { DataTable } from "~/components/DataTable";
import { Icon } from "~/components/Icon";
import { Panel } from "~/components/Panel";
import { validate_where_clause } from "~/generated/surrealist-embed";
import { useActiveSession } from "~/hooks/environment";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { store, useStoreValue } from "~/store";
import { toggleTablePin } from "~/stores/config";
import { clearExplorerData, setExplorerData, setExplorerFilter, setExplorerFiltering } from "~/stores/explorer";
import { ColumnSort, OpenFn } from "~/types";
import { getSurreal } from "~/util/connection";

const PAGE_SIZES = [
	{ label: "10 Results per page", value: "10" },
	{ label: "25 Results per page", value: "25" },
	{ label: "50 Results per page", value: "50" },
	{ label: "100 Results per page", value: "100" },
];

export interface ExplorerPaneProps {
	refreshId: number;
	activeSessionle: string | null;
	activeRecordId: string | null;
	onSelectRecord: OpenFn;
	onRequestCreate: () => void;
}

export function ExplorerPane(props: ExplorerPaneProps) {
	const records = useStoreValue((state) => state.explorer.records);
	const recordCount = useStoreValue((state) => state.explorer.recordCount);
	const filtering = useStoreValue((state) => state.explorer.filtering);
	const filter = useStoreValue((state) => state.explorer.filter);
	
	const isLight = useIsLight();
	const sessionInfo = useActiveSession();
	const [pageText, setPageText] = useInputState("1");
	const [pageSize, setPageSize] = useInputState("25");
	const [sortMode, setSortMode] = useState<ColumnSort | null>(null);
	const [page, setPage] = useState(1);

	const pageCount = Math.ceil(records.length / Number.parseInt(pageSize));

	function setCurrentPage(number: number) {
		setPageText(number.toString());
		setPage(number);
	}

	const toggleFilter = useStable(() => {
		store.dispatch(setExplorerFiltering(!filter));
	});

	const setFilter = useStable((e: ChangeEvent<HTMLInputElement>) => {
		store.dispatch(setExplorerFilter(e.target.value));
	});

	const [showFilter] = useDebouncedValue(filtering, 250);
	const [filterClause] = useDebouncedValue(filter, 500);

	const isFilterValid = useMemo(() => {
		return (!showFilter || !filter) || validate_where_clause(filter);
	}, [showFilter, filter]);

	const fetchRecords = useStable(async () => {
		if (!props.activeSessionle) {
			store.dispatch(clearExplorerData());
			return;
		}

		const surreal = getSurreal();

		if (!surreal || !isFilterValid) {
			return;
		}

		const limitBy = Number.parseInt(pageSize);
		const startAt = (page - 1) * Number.parseInt(pageSize);
		const [sortCol, sortDir] = sortMode || ["id", "asc"];

		let countQuery = `SELECT * FROM count((SELECT * FROM ${props.activeSessionle}`;
		let fetchQuery = `SELECT * FROM ${props.activeSessionle}`;

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

		store.dispatch(setExplorerData({ records, count }));

		if (page > pageCount) {
			setCurrentPage(pageCount || 1);
		}
	});

	useEffect(() => {
		fetchRecords();
	}, [props.activeSessionle, props.refreshId, pageSize, page, sortMode, showFilter, filterClause]);

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

	const handleOpenRow = useStable((record: any) => {
		props.onSelectRecord(record.id);
	});

	const isPinned = props.activeSessionle && sessionInfo?.pinnedTables?.includes(props.activeSessionle);

	const togglePin = useStable(() => {
		if (!props.activeSessionle || !sessionInfo) return;

		store.dispatch(toggleTablePin({
			session: sessionInfo.id,
			table: props.activeSessionle,
		}));
	});

	return (
		<Panel
			title="Record Explorer"
			icon={mdiTable}
			rightSection={
				<Group align="center">
					<ActionIcon title="Create record" onClick={props.onRequestCreate}>
						<Icon color="light.4" path={mdiPlus} />
					</ActionIcon>

					<ActionIcon title="Refresh" onClick={fetchRecords}>
						<Icon color="light.4" path={mdiRefresh} />
					</ActionIcon>

					<ActionIcon title={isPinned ? "Unpin table" : "Pin table"} onClick={togglePin}>
						<Icon color="light.4" path={isPinned ? mdiPinOff : mdiPin} />
					</ActionIcon>

					<ActionIcon title="Toggle filter" onClick={toggleFilter}>
						<Icon color="light.4" path={mdiFilterVariant} />
					</ActionIcon>

					<Divider orientation="vertical" color={isLight ? "light.0" : "dark.5"} />

					<Icon color="light.4" path={mdiDatabase} mr={-10} />
					<Text color="light.4" lineClamp={1}>
						{recordCount || "no"} rows
					</Text>
				</Group>
			}>
			{props.activeSessionle ? (
				<>
					{filter && (
						<TextInput
							placeholder="Enter filter clause..."
							icon={<Icon path={mdiFilterVariant} />}
							value={filter}
							onChange={setFilter}
							error={!isFilterValid}
							autoFocus
							styles={(theme) => ({
								input: {
									fontFamily: "JetBrains Mono",
									borderColor: (isFilterValid ? theme.fn.themeColor("gray") : theme.fn.themeColor("red")) + " !important",
								},
							})}
						/>
					)}
					{records.length > 0 ? (
						<ScrollArea
							style={{ position: "absolute", inset: 12, top: filter ? 40 : 0, bottom: 54, transition: "top .1s" }}>
							<DataTable
								data={records}
								openRecord={props.onSelectRecord}
								active={props.activeRecordId}
								sorting={sortMode}
								onSortingChange={setSortMode}
								onRowClick={handleOpenRow}
							/>
						</ScrollArea>
					) : (
						<Center h="90%" c="light.5">
							Table has no records
						</Center>
					)}

					<Group style={{ position: "absolute", insetInline: 12, bottom: 12 }} spacing="xl">
						<Group spacing="xs">
							<Button
								color="dark.5"
								variant="outline"
								c="light.4"
								px="xs"
								onClick={previousPage}
								disabled={page <= 1}
								style={{ opacity: page <= 1 ? 0.4 : 1 }}>
								<Icon path={mdiArrowLeft} />
							</Button>

							<TextInput
								value={pageText}
								onChange={setPageText}
								maw={46}
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

							<Text color="light.3">of {pageCount} pages</Text>

							<Button
								color="dark.5"
								variant="outline"
								c="light.4"
								px="xs"
								onClick={nextPage}
								disabled={page >= pageCount}
								style={{ opacity: page >= pageCount ? 0.4 : 1 }}>
								<Icon path={mdiArrowRight} />
							</Button>
						</Group>

						<Select value={pageSize} onChange={setPageSize} data={PAGE_SIZES} />
					</Group>
				</>
			) : (
				<Center h="100%" c="light.5">
					Select a table to view its records
				</Center>
			)}
		</Panel>
	);
}
