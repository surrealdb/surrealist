import { ExplorerPane } from "../ExplorerPane";
import { TablesPane } from "../TablesPane";
import { useEffect, useState } from "react";
import { InspectorPane } from "../InspectorPane";
import { useStable } from "~/hooks/stable";
import { SplitValues, Splitter } from "~/components/Splitter";
import { CreatorPane } from "../CreatorPane";
import { useHistory } from "~/hooks/history";
import { useIsConnected } from "~/hooks/connection";
import { getSurreal } from "~/util/connection";
import { store, useStoreValue } from "~/store";
import { closeRecord, openCreator, openEditor, setExplorerTable, setHistory, setHistoryIndex } from "~/stores/explorer";

const SPLIT_SIZE: SplitValues = [250, 450];

export function ExplorerView() {
	const {
		activeTable,
		editingRecord,
		isEditing,
		isCreating,
		recordHistory,
		historyIndex,
	} = useStoreValue(state => state.explorer);

	const isOnline = useIsConnected();
	const [refreshId, setRefreshId] = useState(0);
	const [splitValues, setSplitValues] = useState<SplitValues>(SPLIT_SIZE);
	
	const activeRecordId = editingRecord?.content?.id || null;
	const history = useHistory({
		history: recordHistory,
		index: historyIndex,
		setHistory(items) {
			store.dispatch(setHistory(items));
		},
		setIndex(index) {
			store.dispatch(setHistoryIndex(index));
		}
	});

	const doRefresh = useStable(() => {
		setRefreshId((num) => num + 1);
	});

	const pushNext = useStable((id: string | null) => {
		if (id) {
			history.push(id);
		}
	});

	const setActiveTable = useStable((table: string | null) => {
		store.dispatch(setExplorerTable(table));
	});

	const fetchRecord = useStable(async (id: string | null) => {
		const surreal = getSurreal();

		if (!surreal || !id) {
			return;
		}

		const contentQuery = `SELECT * FROM ${id}`;
		const inputQuery = `SELECT <-? AS relations FROM ${id}`;
		const outputsQuery = `SELECT ->? AS relations FROM ${id}`;

		const response = await surreal.query(`${contentQuery};${inputQuery};${outputsQuery}`);
		const content = response[0].result[0];
		const inputs = response[1].result[0]?.relations || [];
		const outputs = response[2].result[0]?.relations || [];

		const data = content?.id
			? { content, inputs, outputs }
			: { invalid: true, content: { id: id }, inputs: [], outputs: [] };

		store.dispatch(openEditor(data));
	});

	const createRecord = useStable(async (table: string, json: string) => {
		const surreal = getSurreal();

		if (!surreal) {
			return;
		}

		await surreal.query(`CREATE ${table} CONTENT ${json}`);

		store.dispatch(closeRecord());
		doRefresh();
	});

	const updateRecord = useStable(async (json: string) => {
		const surreal = getSurreal();

		if (!surreal) {
			return;
		}

		await surreal.query(`UPDATE ${activeRecordId} CONTENT ${json}`);

		doRefresh();
	});

	const handleCloseRecord = useStable(() => {
		store.dispatch(closeRecord());
		history.clear();
	});

	const handleContentChange = useStable((json: string) => {
		updateRecord(json);
	});

	const requestCreate = useStable(async () => {
		store.dispatch(openCreator());
		history.clear();
	});

	const refreshInspector = useStable(() => {
		fetchRecord(activeRecordId);
	});

	useEffect(() => {
		if (history.current) {
			fetchRecord(history.current);
		} else {
			console.log('closing');
			store.dispatch(closeRecord());
		}
	}, [history.current]);

	useEffect(() => {
		if (!isOnline) {
			store.dispatch(closeRecord());
			store.dispatch(setExplorerTable(null));
		}
	}, [isOnline]);

	return (
		<Splitter
			minSize={SPLIT_SIZE}
			bufferSize={500}
			values={splitValues}
			onChange={setSplitValues}
			direction="horizontal"
			startPane={
				<TablesPane
					active={activeTable}
					onSelectTable={setActiveTable}
					onRefresh={doRefresh}
				/>}
			endPane={
				isCreating ? (
					<CreatorPane
						activeSession={activeTable} 
						onClose={handleCloseRecord}
						onSubmit={createRecord}
					/>
				) : isEditing ? (
					<InspectorPane
						history={history}
						activeRecord={editingRecord}
						onClose={handleCloseRecord}
						onContentChange={handleContentChange}
						onSelectRecord={pushNext}
						onRefreshContent={refreshInspector}
						onRefresh={doRefresh}
					/>
				) : null
			}>
			<ExplorerPane
				refreshId={refreshId}
				activeSession={activeTable}
				onSelectRecord={pushNext}
				activeRecordId={activeRecordId}
				onRequestCreate={requestCreate}
			/>
		</Splitter>
	);
}
