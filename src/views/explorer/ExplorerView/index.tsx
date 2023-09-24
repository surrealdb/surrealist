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

const SPLIT_SIZE: SplitValues = [250, 450];

export interface ExplorerViewProps {}

export function ExplorerView(props: ExplorerViewProps) {
	const [activeSessionle, setActiveTable] = useState<string | null>(null);
	const [activeRecord, setActiveRecord] = useState<any>(null);
	const [creatingRecord, setCreatingRecord] = useState(false);
	const [refreshId, setRefreshId] = useState(0);
	const [splitValues, setSplitValues] = useState<SplitValues>(SPLIT_SIZE);
	const isOnline = useIsConnected();

	const history = useHistory();
	const activeRecordId = activeRecord?.content?.id || null;

	const doRefresh = useStable(() => {
		setRefreshId((num) => num + 1);
	});

	const pushNext = useStable((id: string | null) => {
		if (id) {
			history.push(id);
		}
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

		setCreatingRecord(false);

		if (content?.id) {
			setActiveRecord({
				content,
				inputs,
				outputs,
			});
		} else {
			setActiveRecord({
				invalid: true,
				content: { id: id },
				inputs: [],
				outputs: [],
			});
		}
	});

	const createRecord = useStable(async (table: string, json: string) => {
		const surreal = getSurreal();

		if (!surreal) {
			return;
		}

		await surreal.query(`CREATE ${table} CONTENT ${json}`);

		setCreatingRecord(false);
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
		setCreatingRecord(false);
		history.clear();
	});

	const handleContentChange = useStable((json: string) => {
		updateRecord(json);
	});

	const requestCreate = useStable(async () => {
		setCreatingRecord(true);
		history.clear();
	});

	const refreshInspector = useStable(() => {
		fetchRecord(activeRecordId);
	});

	useEffect(() => {
		if (history.current) {
			fetchRecord(history.current);
		} else {
			setActiveRecord(null);
		}
	}, [history.current]);

	useEffect(() => {
		if (!isOnline) {
			setActiveRecord(null);
			setActiveTable(null);
		}
	}, [isOnline]);

	return (
		<Splitter
			minSize={SPLIT_SIZE}
			bufferSize={500}
			values={splitValues}
			onChange={setSplitValues}
			direction="horizontal"
			startPane={<TablesPane active={activeSessionle} onSelectTable={setActiveTable} onRefresh={doRefresh} />}
			endPane={
				creatingRecord ? (
					<CreatorPane activeSessionle={activeSessionle} onClose={handleCloseRecord} onSubmit={createRecord} />
				) : activeRecord ? (
					<InspectorPane
						history={history}
						activeRecord={activeRecord}
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
				activeSessionle={activeSessionle}
				onSelectRecord={pushNext}
				activeRecordId={activeRecordId}
				onRequestCreate={requestCreate}
			/>
		</Splitter>
	);
}
