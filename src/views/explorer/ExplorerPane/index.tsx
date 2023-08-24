import { useImmer } from 'use-immer';
import { useEffect, useState } from 'react';
import { Center } from '@mantine/core';
import { mdiTable } from '@mdi/js';

import { adapter } from '~/adapter';
import { DataTable } from '~/components/DataTable';
import { Panel } from '~/components/Panel';
import { useActiveTab } from '~/hooks/environment';
import { useStable } from '~/hooks/stable';
import { actions, store } from '~/store';
import { OpenFn } from '~/types';
import { updateConfig } from '~/util/helpers';
import { useInputState } from '@mantine/hooks';

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
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 5, //customize the default page size
	});
	const tabInfo = useActiveTab();

	const fetchRecords = useStable(async () => {
		// No active table, no records
		if (!props.activeTable) {
			setRecords([]);
			return;
		}

		const surreal = adapter.getSurreal();

		if (!surreal) return;

		let countQuery = `SELECT * FROM count((SELECT * FROM ${props.activeTable}`;
		let fetchQuery = `SELECT * FROM ${props.activeTable}`;

		countQuery += '))';
		fetchQuery += ` LIMIT ${pagination.pageSize}`;

		const startAt = pagination.pageIndex * pagination.pageSize;

		if (startAt > 0) {
			fetchQuery += ` START ${startAt}`;
		}

		const response = await surreal.query(`${countQuery};${fetchQuery}`);
		const resultCount = response[0].result?.[0] || 0;
		const resultRecords = response[1].result || [];

		setRecordCount(resultCount);
		setRecords(resultRecords);
	});

	/// Fetch records
	useEffect(() => {
		fetchRecords();
	}, [props.activeTable, props.refreshId, pagination.pageIndex, pagination.pageSize]);

	const handleOpenRow = useStable((record: any) => {
		props.onSelectRecord(record.id);
	});

	const isPinned = (props.activeTable &&
		tabInfo?.pinnedTables?.includes(props.activeTable)) as boolean;

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
				<Panel title="Record Explorer" icon={mdiTable} padding="0">
					<Center h="100%" c="light.5">
						Select a table to view its records
					</Center>
				</Panel>
			);
		}

		if (records.length > 0) {
			return (
				<>
					<DataTable
						data={records}
						openRecord={props.onSelectRecord}
						active={props.activeRecordId}
						fetchRecords={fetchRecords}
						recordCount={recordCount}
						togglePin={togglePin}
						isPinned={isPinned}
						createRecord={props.onRequestCreate}
						pagination={pagination}
						onPaginationChange={setPagination}
						onRowClick={handleOpenRow}
					/>
				</>
			);
		} else {
			return (
				<Panel title="Record Explorer" icon={mdiTable} padding="0">
					<Center h="90%" c="light.5">
						Table has no records
					</Center>
				</Panel>
			);
		}
	};

	return getTable();
}
