import { useMemo, useState } from "react";
import { SplitValues, Splitter } from "~/components/Splitter";
import { useStoreValue } from "~/store";
import { DesignPane } from "../DesignPane";
import { TableGraphPane } from "../TableGraphPane";

const SPLIT_SIZE: SplitValues = [undefined, 450];

export interface DesignerViewProps {
}

export function DesignerView(props: DesignerViewProps) {
	const [activeTable, setActiveTable] = useState<string | null>(null);
	const [splitValues, setSplitValues] = useState<SplitValues>(SPLIT_SIZE);
	const tables = useStoreValue(state => state.databaseSchema);

	const tableSchema = useMemo(() => {
		return tables.find(table => table.schema.name === activeTable) || null;
	}, [tables, activeTable]);

	return (
		<Splitter
			minSize={SPLIT_SIZE}
			bufferSize={500}
			values={splitValues}
			onChange={setSplitValues}
			direction="horizontal"
			endPane={
				tableSchema && (
					<DesignPane
						table={tableSchema}
					/>
				)
			}
		>
			<TableGraphPane
				tables={tables}
				setActiveTable={setActiveTable}
			/>
		</Splitter>
	);
}