import { ContentPane } from "~/components/Pane";
import { iconList } from "~/util/icons";

export function DiagnosticDetailsPanel() {
	return (
		<ContentPane
			title="Details"
			icon={iconList}
		>
			Test
		</ContentPane>
	);
}
