import { mdiListBox } from "@mdi/js";
import { Panel } from "~/components/Panel";

export function TabsPane() {
	return (
		<Panel
			icon={mdiListBox}
			title="Queries"
		>
			Test
		</Panel>
	);
}