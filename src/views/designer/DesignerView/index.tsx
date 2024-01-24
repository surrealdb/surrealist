import { useMemo, useState } from "react";
import { SplitValues, Splitter } from "~/components/Splitter";
import { store, useStoreValue } from "~/store";
import { DesignPane } from "../DesignPane";
import { TableGraphPane } from "../TableGraphPane";
import { useStable } from "~/hooks/stable";
import { setDesignerTable } from "~/stores/designer";
import { useTables } from "~/hooks/schema";
import { useImmer } from "use-immer";
import { useSaveable } from "~/hooks/save";
import { buildDefinitionQueries, isSchemaValid } from "../DesignPane/helpers";
import { TableDefinition } from "~/types";
import { showError } from "~/util/helpers";
import { getActiveSurreal } from "~/util/connection";
import { fetchDatabaseSchema } from "~/util/schema";

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

	const [data, setData] = useImmer(tableSchema);
	const isValid = data ? isSchemaValid(data) : true;
	
	const handle = useSaveable({
		valid: !!isValid,
		track: data || {} as TableDefinition,
		onSave(original) {
			if (!original?.schema) {
				showError("Save failed", "Could not determine previous state");
				return;
			}

			const query = buildDefinitionQueries(original, data!);
			const surreal = getActiveSurreal();

			surreal.query(query)
				.then(() => fetchDatabaseSchema())
				.catch((err) => {
					showError("Failed to apply schema", err.message);
				});
		},
		onRevert(original) {
			setData(original);
		}
	});

	return (
		<Splitter
			minSize={SPLIT_SIZE}
			bufferSize={500}
			values={splitValues}
			onChange={setSplitValues}
			direction="horizontal"
			endPane={
				tableSchema && data && (
					<DesignPane
						value={data}
						onChange={setData as any}
						onClose={closeActiveTable}
						handle={handle}
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