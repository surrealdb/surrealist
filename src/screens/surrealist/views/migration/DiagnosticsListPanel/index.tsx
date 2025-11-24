import { Button } from "@mantine/core";
import { ContentPane } from "~/components/Pane";
import { iconList } from "~/util/icons";

export function DiagnosticsListPanel() {
	return (
		<ContentPane
			title="Diagnostics"
			icon={iconList}
			rightSection={
				<Button
					variant="gradient"
					size="xs"
				>
					Re-run diagnostics
				</Button>
			}
		>
			Test
		</ContentPane>
	);
}
