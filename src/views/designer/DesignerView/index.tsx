import { useMemo, useState } from "react";
import { Splitter } from "~/components/Splitter";
import { TablesPane } from "~/components/TablesPane";
import { useIsConnected } from "~/hooks/connection";
import { useStoreValue } from "~/store";
import { StructurePane } from "../StructurePane";

export interface DesignerViewProps {
}

export function DesignerView(props: DesignerViewProps) {
	const [activeTable, setActiveTable] = useState<string | null>(null);
	const tables = useStoreValue(state => state.databaseSchema);

	const schema = useMemo(() => {
		return tables.find(table => table.schema.name === activeTable) || null;
	}, [tables, activeTable]);

	return (
		<Splitter
			minSize={[250, 250]}
			bufferSize={550}
			startPane={
				<TablesPane
					onSelectTable={setActiveTable}
					withModification
				/>
			}
		>
			<StructurePane
				table={schema}
			/>
		</Splitter>
	);
}