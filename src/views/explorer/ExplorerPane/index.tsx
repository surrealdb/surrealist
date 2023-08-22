import { Center } from "@mantine/core";
import { useDebouncedValue, useInputState } from "@mantine/hooks";
import { mdiTable } from "@mdi/js";
import { useEffect, useState } from "react";
import { useImmer } from "use-immer";
import { adapter } from "~/adapter";
import { DataTable } from "~/components/DataTable";
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
	const [pageText, setPageText] = useInputState("1");
	const [pageSize, setPageSize] = useInputState("25");
	const [sortMode, setSortMode] = useState<ColumnSort | null>(null);
	const [page, setPage] = useState(1);
	const tabInfo = useActiveTab();

	const pageCount = Math.ceil(recordCount / Number.parseInt(pageSize));

	function setCurrentPage(number: number) {
		setPageText(number.toString());
		setPage(number);
	}

	const [showFilter] = useDebouncedValue(filter, 250);
	const [filterClause] = useDebouncedValue(filterText, 500);

	const fetchRecords = useStable(async () => {
		if (!props.activeTable) {
			setRecords([]);
			return;
		}

		const surreal = adapter.getSurreal();

		if (!surreal || !filterValid) {
			return;
		}

		const limitBy = Number.parseInt(pageSize);
		const startAt = (page - 1) * Number.parseInt(pageSize);
		const [sortCol, sortDir] = sortMode || ["id", "asc"];

		let countQuery = `SELECT * FROM count((SELECT * FROM ${props.activeTable}`;
		let fetchQuery = `SELECT * FROM ${props.activeTable}`;

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
		const resultCount = response[0].result?.[0] || 0;
		const resultRecords = response[1].result || [];

		setRecordCount(resultCount);
		setRecords(resultRecords);

		if (page > pageCount) {
			setCurrentPage(pageCount || 1);
		}
	});

	useEffect(() => {
		fetchRecords();
	}, [props.activeTable, props.refreshId, pageSize, page, sortMode, showFilter, filterClause]);

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

	return (
		<Panel title="Record Explorer" icon={mdiTable} padding="0">
			{props.activeTable ? (
				<>
					{records.length > 0 ? (
						<DataTable
							data={records}
							openRecord={props.onSelectRecord}
							active={props.activeRecordId}
							onRowClick={handleOpenRow}
						/>
					) : (
						<Center h="90%" c="light.5">
							Table has no records
						</Center>
					)}
				</>
			) : (
				<Center h="100%" c="light.5">
					Select a table to view its records
				</Center>
			)}
		</Panel>
	);
}
