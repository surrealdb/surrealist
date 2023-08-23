import { useImmer } from "use-immer";
import { useEffect, useState } from "react";
import { useDebouncedValue, useInputState } from "@mantine/hooks";
import { ActionIcon, Center, Divider, Group, Text } from "@mantine/core";
import { mdiDatabase, mdiFilterVariant, mdiPin, mdiPinOff, mdiPlus, mdiRefresh, mdiTable } from "@mdi/js";

import { adapter } from "~/adapter";
import { DataTable } from "~/components/DataTable";
import { Icon } from "~/components/Icon";
import { Panel } from "~/components/Panel";
import { useActiveTab } from "~/hooks/environment";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { actions, store } from "~/store";
import { ColumnSort, OpenFn } from "~/types";
import { updateConfig } from "~/util/helpers";

export interface ExplorerPaneProps {
	refreshId: number;
	activeTable: string | null;
	activeRecordId: string | null;
	onSelectRecord: OpenFn;
	onRequestCreate: () => void;
}

export function ExplorerPane(props: ExplorerPaneProps) {
	const isLight = useIsLight();
	const [records, setRecords] = useImmer<any[]>([]);
	const [recordCount, setRecordCount] = useState(0);
	const [filterValid, setFilterValid] = useState(false);
	const [filter, setFilter] = useState(false);
	const [filterText, setFilterText] = useInputState("");
	const [sortMode, setSortMode] = useState<ColumnSort | null>(null);
	const tabInfo = useActiveTab();

	const toggleFilter = useStable(() => {
		setFilter(!filter);
	});

	const [showFilter] = useDebouncedValue(filter, 250);
	const [filterClause] = useDebouncedValue(filterText, 500);

	const fetchRecords = useStable(async () => {
		// No active table, no records
		if (!props.activeTable) {
			setRecords([]);
			return;
		}

		const surreal = adapter.getSurreal();

		// Can't get surreal or filter is not valid
		if (!surreal || !filterValid) {
			return;
		}

		//const limitBy = Number.parseInt(pageSize);
		const [sortCol, sortDir] = sortMode || ["id", "asc"];

		let countQuery = `SELECT * FROM count((SELECT * FROM ${props.activeTable}`;
		let fetchQuery = `SELECT * FROM ${props.activeTable}`;

		if (showFilter && filterClause) {
			countQuery += ` WHERE ${filterClause}`;
			fetchQuery += ` WHERE ${filterClause}`;
		}

		countQuery += "))";
		// fetchQuery += ` ORDER BY ${sortCol} ${sortDir} LIMIT ${limitBy}`;
		fetchQuery += ` ORDER BY ${sortCol} ${sortDir}`;

		const response = await surreal.query(`${countQuery};${fetchQuery}`);
		const resultCount = response[0].result?.[0] || 0;
		const resultRecords = response[1].result || [];

		setRecordCount(resultCount);
		setRecords(resultRecords);
	});

	/// Fetch records
	useEffect(() => {
		fetchRecords();
	}, [props.activeTable, props.refreshId, sortMode, showFilter, filterClause]);

	useEffect(() => {
		if (showFilter && filterText) {
			adapter.validateWhereClause(filterText).then((isValid) => {
				setFilterValid(isValid);
			});
		} else {
			setFilterValid(true);
		}
	}, [showFilter, filterText]);

	const handleOpenRow = useStable((record: any) => {
		props.onSelectRecord(record.id);
	});

	const isPinned = props.activeTable && tabInfo?.pinnedTables?.includes(props.activeTable);

	const togglePin = useStable(() => {
		if (!props.activeTable || !tabInfo) return;

		store.dispatch(
			actions.toggleTablePin({
				tab: tabInfo.id,
				table: props.activeTable,
			})
		);

		updateConfig();
	});

	const getTable = () => {
		if (!props.activeTable) {
			return (
				<Center h="100%" c="light.5">
					Select a table to view its records
				</Center>
			);
		}

		if (records.length > 0) {
			return (
				<>
					<DataTable
						data={records}
						openRecord={props.onSelectRecord}
						active={props.activeRecordId}
						onRowClick={handleOpenRow}
					/>
				</>
			);
		} else {
			return (
				<Center h="90%" c="light.5">
					Table has no records
				</Center>
			);
		}
	};

	return (
		<Panel
			title="Record Explorer"
			icon={mdiTable}
			padding="0"
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
			{getTable()}
		</Panel>
	);
}
