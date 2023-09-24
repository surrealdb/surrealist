import { useState } from "react";
import { Splitter, SplitValues } from "~/components/Splitter";
import { QueriesPane } from "../QueriesPane";
import { EditorPane } from "../EditorPane";
import { InboxPane } from "../InboxPane";
import { useStable } from "~/hooks/stable";
import { actions, store } from "~/store";
import { useActiveSession } from "~/hooks/environment";
import { newId } from "~/util/helpers";

export interface QueryViewProps {
}

export function LiveView() {
	const session = useActiveSession();
	const [splitValues, setSplitValues] = useState<SplitValues>([500, undefined]);
	const [innerSplitValues, setInnerSplitValues] = useState<SplitValues>([undefined, undefined]);
	const [editingId, setEditingId] = useState("");
	const [isEditing, setIsEditing] = useState(false);
	const [editingData, setEditingData] = useState<any>(null);

	const handleNewQuery = useStable(() => {
		setEditingId("");
		setIsEditing(true);
		setEditingData(null);
	});

	const handleEditQuery = useStable((id: string) => {
		const query = session.liveQueries.find((q) => q.id === id);

		setEditingId(id);
		setIsEditing(true);
		setEditingData({
			name: query?.name || '',
			text: query?.text || ''
		});
	});

	const handleQuerySave = useStable((name: string, text: string) => {
		if (editingId.length === 0) {
			const id = newId();

			store.dispatch(actions.updateSession({
				id: session.id,
				liveQueries: [...session.liveQueries, { id, name, text }],
			}));
		} else {
			const queryIndex = session.liveQueries.findIndex((q) => q.id === editingId);

			store.dispatch(actions.updateSession({
				id: session.id,
				liveQueries: session.liveQueries.with(queryIndex, {
					...session.liveQueries[queryIndex],
					name,
					text
				})
			}));
		}

		setEditingId("");
		setIsEditing(false);
	});

	const handleQueryClose = useStable(() => {
		setEditingId("");
		setIsEditing(false);
	});

	return (
		<Splitter
			minSize={300}
			values={splitValues}
			onChange={setSplitValues}
			direction="horizontal"
			bufferSize={520}
			startPane={
				<Splitter
					minSize={280}
					values={innerSplitValues}
					onChange={setInnerSplitValues}
					bufferSize={100}
					direction="vertical"
					endPane={isEditing && (
						<EditorPane
							query={editingData}
							onSave={handleQuerySave}
							onClose={handleQueryClose}
						/>
					)}
				>
					
					<QueriesPane
						onAddQuery={handleNewQuery}
						onEditQuery={handleEditQuery}
					/>
				</Splitter>
			}
		>
			<InboxPane />
		</Splitter>
	);
}
