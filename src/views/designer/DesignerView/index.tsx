import { useState } from "react";
import { Splitter } from "~/components/Splitter";
import { TablesPane } from "~/components/TablesPane";
import { useStoreValue } from "~/store";
import { StructurePane } from "../StructurePane";

export interface DesignerViewProps {
	isOnline: boolean;
}

export function DesignerView(props: DesignerViewProps) {
	const [activeTable, setActiveTable] = useState<string | null>(null);
	const tables = useStoreValue(state => state.tables);
	const table = tables.find(table => table.name === activeTable);

	return (
		<Splitter
			minSize={[250, 250]}
			bufferSize={550}
			startPane={
				<TablesPane
					isOnline={props.isOnline}
					onSelectTable={setActiveTable}
					withModification
				/>
			}
		>
			<StructurePane
				table={table}
			/>
		</Splitter>
	);
}