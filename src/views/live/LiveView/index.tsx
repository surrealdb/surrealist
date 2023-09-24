import { useState } from "react";
import { Splitter, SplitValues } from "~/components/Splitter";
import { QueriesPane } from "../QueriesPane";
import { EditorPane } from "../EditorPane";
import { InboxPane } from "../InboxPane";
import { useStable } from "~/hooks/stable";
import { actions, store } from "~/store";
import { useActiveSession } from "~/hooks/environment";
import { newId } from "~/util/helpers";
import { useLater } from "~/hooks/later";
import { useLegacyLiveSocket } from "./legacy";
import { useImmer } from "use-immer";
import { LiveMessage } from "~/types";
import { MAX_LIVE_MESSAGES } from "~/constants";

export interface QueryViewProps {
}

export function LiveView(props: QueryViewProps) {
	const session = useActiveSession();
	const [splitValues, setSplitValues] = useState<SplitValues>([500, undefined]);
	const [innerSplitValues, setInnerSplitValues] = useState<SplitValues>([undefined, undefined]);
	const [editingId, setEditingId] = useState("");
	const [isEditing, setIsEditing] = useState(false);
	const [editingData, setEditingData] = useState<any>(null);
	const [activeQueries, setActiveQueries] = useState<string[]>([]);
	const [messages, setMessages] = useImmer<LiveMessage[]>([]);

	const handleLiveMessage = useStable((msg: any) => {
		setMessages((draft) => {
			draft.unshift(msg);

			if (draft.length > MAX_LIVE_MESSAGES) {
				draft.pop();
			}
		});
	});

	const clearMessages = useStable(() => {
		setMessages([]);
	});

	const socket = useLegacyLiveSocket({
		onLiveMessage: handleLiveMessage,
		onDisconnect() {
			setActiveQueries([]);
			setMessages([]);
		},
	});

	const startQueryLater = useLater(socket.startQuery);

	const toggleQuery = useStable(async (id: string) => {
		if (activeQueries.includes(id)) {
			setActiveQueries(activeQueries.filter((x) => x !== id));

			socket.killQuery(id);

			if (activeQueries.length === 1) {
				socket.closeConnection();
			}
		} else {
			setActiveQueries([...activeQueries, id]);

			await socket.openConnection();
			
			startQueryLater(id);
		}
	});

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
						activeQueries={activeQueries}
						toggleQuery={toggleQuery}
						onAddQuery={handleNewQuery}
						onEditQuery={handleEditQuery}
					/>
				</Splitter>
			}
		>
			<InboxPane
				messages={messages}
				onClearAll={clearMessages}
			/>
		</Splitter>
	);
}
