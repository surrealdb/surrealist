import { ExplorerPane } from "../ExplorerPane";
import { TablesPane } from "../TablesPane";
import { Splitter } from "../Splitter";
import { useState } from "react";

export interface ExplorerViewProps {
	isOnline: boolean;
}

export function ExplorerView(props: ExplorerViewProps) {
	const [activeTable, setActiveTable] = useState<string | null>(null);
	
	return (
		<Splitter
			minSize={225}
			direction="horizontal"
			startPane={
				<TablesPane
					isOnline={props.isOnline}
					onSelectTable={setActiveTable}
				/>
			}
		>
			<ExplorerPane
				activeTable={activeTable}
			/>
		</Splitter>
	);
}