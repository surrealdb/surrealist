import { useImmer } from "use-immer";
import { useEffect, useState } from "react";
import { useDebouncedValue, useInputState } from "@mantine/hooks";
import { ActionIcon, Center, Group, TextInput, Text } from "@mantine/core";
import { MRT_PaginationState, MRT_SortingState } from "mantine-react-table";
import { mdiDatabase, mdiFilterVariant, mdiPlus, mdiRefresh, mdiTable } from "@mdi/js";

import { adapter } from "~/adapter";
import { DataTable } from "~/components/DataTable";
import { Panel } from "~/components/Panel";
import { useActiveTab } from "~/hooks/environment";
import { useStable } from "~/hooks/stable";
import { actions, store } from "~/store";
import { OpenFn } from "~/types";
import { updateConfig } from "~/util/helpers";

import { Icon } from "~/components/Icon";

export interface ExplorerPaneProps {
	refreshId: number;
	activeTable: string | null;
	activeRecordId: string | null;
	onSelectRecord: OpenFn;
	onRequestCreate: () => void;
}

export function ExplorerPane(props: ExplorerPaneProps) {
	const [records, setRecords] = useImmer<any[]>([]);
	const [recordCount, setRecordCount] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [globalFilterValid, setGlobalFilterValid] = useState(false);
	const [globalFilter, setGlobalFilter] = useState(false);
	const [globalFilterText, setGlobalFilterText] = useInputState("");
	const [sorting, setSorting] = useState<MRT_SortingState>([]);
	const [pagination, setPagination] = useState<MRT_PaginationState>({
		pageIndex: 0,
		pageSize: 5,
	});
	const tabInfo = useActiveTab();

	const toggleFilter = useStable(() => {
		setGlobalFilter(!globalFilter);
	});

	const [showFilter] = useDebouncedValue(globalFilter, 250);
	const [filterClause] = useDebouncedValue(globalFilterText, 500);

	const fetchRecords = useStable(async () => {
		const loadingTimeout = setTimeout(() => {
			setIsLoading(true); // if data load is slow, show loading indicator
		}, 300);

		// No active table, no records
		if (!props.activeTable) {
			setRecords([]);
			return;
		}

		const surreal = adapter.getSurreal();

		if (!surreal || !globalFilterValid) return;

		let countQuery = `SELECT * FROM count((SELECT * FROM ${props.activeTable}`;
		let fetchQuery = `SELECT * FROM ${props.activeTable}`;

		if (showFilter && filterClause) {
			countQuery += ` WHERE ${filterClause}`;
			fetchQuery += ` WHERE ${filterClause}`;
		}

		countQuery += "))";

		if (sorting.length > 0) {
			fetchQuery += " ORDER BY ";

			for (let columnSort of sorting) {
				fetchQuery += `${columnSort.id} ${columnSort.desc ? `DESC` : `ASC`}, `;
			}

			fetchQuery = fetchQuery.slice(0, -2);
		}

		fetchQuery += ` LIMIT ${pagination.pageSize}`;

		const startAt = pagination.pageIndex * pagination.pageSize;

		if (startAt > 0) {
			fetchQuery += ` START ${startAt}`;
		}

		const response = await surreal.query(`${countQuery};${fetchQuery}`);
		const resultCount = response[0].result?.[0] || 0;
		const resultRecords = response[1].result || [];

		// if data loaded before timeour fired, cancel loading indicator
		clearTimeout(loadingTimeout);
		setIsLoading(false);

		setRecordCount(resultCount);
		setRecords(resultRecords);
	});

	/// Fetch records
	useEffect(() => {
		fetchRecords();
	}, [
		props.activeTable,
		props.refreshId,
		pagination.pageIndex,
		pagination.pageSize,
		sorting,
		showFilter,
		filterClause,
	]);

	useEffect(() => {
		if (showFilter && globalFilterText) {
			adapter.validateWhereClause(globalFilterText).then((isValid) => {
				setGlobalFilterValid(isValid);
			});
		} else {
			setGlobalFilterValid(true);
		}
	}, [showFilter, globalFilterText]);

	const handleOpenRow = useStable((record: any) => {
		props.onSelectRecord(record.id);
	});

	const isPinned = (props.activeTable && tabInfo?.pinnedTables?.includes(props.activeTable)) as boolean;

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

	return !props.activeTable ? (
		<Panel title="Record Explorer" icon={mdiTable} padding="0">
			<Center h="100%" c="light.5">
				Select a table to view its records
			</Center>
		</Panel>
	) : (
		<DataTable
			data={records}
			openRecord={props.onSelectRecord}
			active={props.activeRecordId}
			fetchRecords={fetchRecords}
			recordCount={recordCount}
			togglePin={togglePin}
			isPinned={isPinned}
			isLoading={isLoading}
			createRecord={props.onRequestCreate}
			sorting={sorting}
			onSortingChange={setSorting}
			pagination={pagination}
			onPaginationChange={setPagination}
			filterProps={{ globalFilter, globalFilterText, globalFilterValid, toggleFilter, setGlobalFilterText }}
			onRowClick={handleOpenRow}
		/>
	);
}
