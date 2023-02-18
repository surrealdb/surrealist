import { useEffect, useState } from "react";
import { Splitter } from "~/components/Splitter";
import { TablesPane } from "~/components/TablesPane";
import { useStable } from "~/hooks/stable";
import { getActiveSurreal } from "~/surreal";
import { GraphPane } from "../GraphPane";
import { SchemaPane } from "../SchemaPane";

export interface DesignerViewProps {
	isOnline: boolean;
}

export function DesignerView(props: DesignerViewProps) {
	const [activeTable, setActiveTable] = useState<string | null>(null);
	const [tableInfo, setTableInfo] = useState<any>(null);

	const fetchInfo = useStable(async () => {
		if (!activeTable) {
			return;
		}

		const surreal = getActiveSurreal();
		const response = await surreal.query(`INFO FOR DB; INFO FOR TABLE ${activeTable};`);
		const tableList = response[0].result;
		const infoDefs = response[1].result;
		
		setTableInfo({
			...infoDefs,
			def: tableList.tb[activeTable] || ''
		});
	});

	useEffect(() => {
		if (props.isOnline) {
			fetchInfo();
		}
	}, [props.isOnline, activeTable]);

	return (
		<Splitter
			minSize={[250, 400]}
			bufferSize={550}
			startPane={
				<TablesPane
					isOnline={props.isOnline}
					onSelectTable={setActiveTable}
				/>
			}
			endPane={
				<GraphPane />
			}
		>
			<SchemaPane
				table={activeTable}
				tableInfo={tableInfo}
			/>
		</Splitter>
	);
}