import { useMemo, useState } from "react";
import { SplitValues, Splitter } from "~/components/Splitter";
import { store, useStoreValue } from "~/store";
import { DesignPane } from "../DesignPane";
import { TableGraphPane } from "../TableGraphPane";
import { useStable } from "~/hooks/stable";
import { setDesignerTable } from "~/stores/designer";
import { useTables } from "~/hooks/schema";

const SPLIT_SIZE: SplitValues = [undefined, 450];

export interface DesignerViewProps {
}

export function DesignerView(props: DesignerViewProps) {
	const activeTable = useStoreValue(state => state.designer.activeTable);
	const tables = useTables();

	const [splitValues, setSplitValues] = useState<SplitValues>(SPLIT_SIZE);

	const tableSchema = useMemo(() => {
		return tables.find(table => table.schema.name === activeTable) || null;
	}, [tables, activeTable]);

	const setActiveTable = useStable((table: string) => {
		store.dispatch(setDesignerTable(table));
	});

	const closeActiveTable = useStable(() => {
		store.dispatch(setDesignerTable(null));
	});

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
						onClose={closeActiveTable}
					/>
				)
			}
		>
			<TableGraphPane
				tables={tables}
				active={tableSchema}
				setActiveTable={setActiveTable}
			/>
		</Splitter>
	);
}