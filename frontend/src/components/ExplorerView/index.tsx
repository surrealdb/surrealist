import { ExplorerPane } from "../ExplorerPane";
import { TablesPane } from "../TablesPane";
import { Splitter } from "../Splitter";
import { useState } from "react";
import { InspectorPane } from "../InspectorPane";
import { useStable } from "~/hooks/stable";
import { getSurreal } from "~/surreal";
import { showNotification } from "@mantine/notifications";

export interface ExplorerViewProps {
	isOnline: boolean;
}

export function ExplorerView(props: ExplorerViewProps) {
	const [activeTable, setActiveTable] = useState<string | null>(null);
	const [activeRecord, setActiveRecord] = useState<any>(null);
	const [refreshId, setRefreshId] = useState(0);

	const activeRecordId = activeRecord?.content?.id || null;

	const fetchRecord = useStable(async (id: string) => {
		const surreal = getSurreal();

		if (!surreal) {
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

		setActiveRecord({
			content,
			inputs,
			outputs
		});
	});

	const updateRecord = useStable(async (json: string) => {
		const surreal = getSurreal();

		if (!surreal) {
			return;
		}

		await surreal.query(`UPDATE ${activeRecordId} CONTENT ${json}`);

		setRefreshId(num => num + 1);
	});

	const handleCloseRecord = useStable(() => {
		setActiveRecord(null);
	});

	const handleContentChange = useStable((json: string) => {
		updateRecord(json);
	});
	
	return (
		<Splitter
			minSize={[225, 450]}
			bufferSize={500}
			direction="horizontal"
			startPane={
				<TablesPane
					isOnline={props.isOnline}
					onSelectTable={setActiveTable}
				/>
			}
			endPane={
				activeRecord && (
					<InspectorPane
						record={activeRecord}
						onClose={handleCloseRecord}
						onContentChange={handleContentChange}
						onSelectRecord={fetchRecord}
					/>
				)
			}
		>
			<ExplorerPane
				refreshId={refreshId}
				activeTable={activeTable}
				onSelectRecord={fetchRecord}
				activeRecordId={activeRecordId}
			/>
		</Splitter>
	);
}