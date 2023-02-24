import { useState } from "react";
import { Splitter } from "~/components/Splitter";
import { TablesPane } from "~/components/TablesPane";
import { useStable } from "~/hooks/stable";
import { useStoreValue } from "~/store";
import { fetchTableSchema } from "~/util/schema";
import { StructurePane } from "../StructurePane";

export interface DesignerViewProps {
	isOnline: boolean;
}

export function DesignerView(props: DesignerViewProps) {
	const [schema, setSchema] = useState<any>(null);
	const tables = useStoreValue(state => state.tables);

	const selectTable = useStable(async (name: string | null) => {
		if (name) {
			const table = tables.find(table => table.name === name);

			if (!table) {
				setSchema(null);
				return
			}

			const tableSchema = await fetchTableSchema(table);

			setSchema({
				table,
				...tableSchema
			});
		} else {
			setSchema(null);
		}
	});

	return (
		<Splitter
			minSize={[250, 250]}
			bufferSize={550}
			startPane={
				<TablesPane
					isOnline={props.isOnline}
					onSelectTable={selectTable}
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