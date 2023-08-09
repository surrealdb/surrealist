import { mdiWrench } from "@mdi/js";
import { Panel } from "~/components/Panel";
import { TableDefinition } from "~/types";

export interface DesignPaneProps {
	table: TableDefinition;
}

export function DesignPane(props: DesignPaneProps) {
	return (
		<Panel
			title="Design"
			icon={mdiWrench}
		>
			
		</Panel>
	)
}