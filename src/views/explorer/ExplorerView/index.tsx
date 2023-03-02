import { ExplorerPane } from "../ExplorerPane";
import { TablesPane } from "../../../components/TablesPane";
import { useState } from "react";
import { InspectorPane } from "../InspectorPane";
import { useStable } from "~/hooks/stable";
import { getSurreal } from "~/surreal";
import { showNotification } from "@mantine/notifications";
import { Splitter } from "~/components/Splitter";
import { CreatorPane } from "../CreatorPane";

export interface ExplorerViewProps {
	isOnline: boolean;
}

export function ExplorerView(props: ExplorerViewProps) {
	const [activeTable, setActiveTable] = useState<string | null>(null);
	const [activeRecord, setActiveRecord] = useState<any>(null);
	const [creatingRecord, setCreatingRecord] = useState(false);
	const [refreshId, setRefreshId] = useState(0);

	const activeRecordId = activeRecord?.content?.id || null;

	const doRefresh = useStable(() => {
		setRefreshId(num => num + 1);
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

		if (!content?.id) {
			showNotification({
				message: 'Record link has no destination',
			});
			return;
		}

		setCreatingRecord(false);
		setActiveRecord({
			content,
			inputs,
			outputs
		});
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
		setActiveRecord(null);
	});

	const handleContentChange = useStable((json: string) => {
		updateRecord(json);
	});

	const requestCreate = useStable(async () => {
		setCreatingRecord(true);
		setActiveRecord(null);
	});
	
	return (
		<Splitter
			minSize={[250, 450]}
			bufferSize={500}
			direction="horizontal"
			startPane={
				<TablesPane
					isOnline={props.isOnline}
					onSelectTable={setActiveTable}
					withModification
				/>
			}
			endPane={
				creatingRecord ? (
					<CreatorPane
						activeTable={activeTable}
						onClose={handleCloseRecord}
						onSubmit={createRecord}
					/>
				) : activeRecord ? (
					<InspectorPane
						record={activeRecord}
						onClose={handleCloseRecord}
						onContentChange={handleContentChange}
						onSelectRecord={fetchRecord}
						onRefresh={doRefresh}
					/>
				) : null
			}
		>
			<ExplorerPane
				refreshId={refreshId}
				activeTable={activeTable}
				onSelectRecord={fetchRecord}
				activeRecordId={activeRecordId}
				onRequestCreate={requestCreate}
			/>
		</Splitter>
	);
}