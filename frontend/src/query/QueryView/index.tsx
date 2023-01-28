import { MouseEvent } from "react";
import { useStoreValue } from "~/store";
import { FavoritesPane } from "../FavoritesPane";
import { HistoryPane } from "../HistoryPane";
import { QueryPane } from "../QueryPane";
import { ResultPane } from "../ResultPane";
import { VariablesPane } from "../../query/VariablesPane";
import { Splitter } from "~/components/Splitter";

export interface QueryViewProps {
	isOnline: boolean;
	sendQuery: (e?: MouseEvent) => any;
}

export function QueryView(props: QueryViewProps) {
	const enableListing = useStoreValue(state => state.config.enableListing);
	const queryListing = useStoreValue(state => state.config.queryListing);
	
	return (
		<Splitter
			minSize={300}
			direction="horizontal"
			startPane={
				<Splitter
					minSize={120}
					bufferSize={0}
					direction="vertical"
					endPane={
						<VariablesPane />
					}
				>
					<QueryPane
						isConnected={props.isOnline}
						onExecuteQuery={props.sendQuery}
					/>
				</Splitter>
			}
			endPane={!enableListing ? null : queryListing == 'history' ? (
				<HistoryPane
					onExecuteQuery={props.sendQuery}
				/>
			) : (
				<FavoritesPane
					onExecuteQuery={props.sendQuery}
				/>
			)}
		>
			<ResultPane />
		</Splitter>
	);
}