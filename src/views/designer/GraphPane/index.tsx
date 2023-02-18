import { mdiGraph } from "@mdi/js";
import { Panel } from "~/components/Panel";

export function GraphPane() {
	return (
		<Panel
			title="Graph"
			icon={mdiGraph}
		/>
	)
}