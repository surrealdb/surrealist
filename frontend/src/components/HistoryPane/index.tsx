import { ScrollArea, useMantineTheme } from "@mantine/core";
import { mdiHistory } from "@mdi/js";
import { useState } from "react";
import { useActiveTab } from "~/hooks/tab";
import { useIsLight } from "~/hooks/theme";
import { useStoreValue } from "~/store";
import { Panel } from "../Panel";

export function HistoryPane() {
	const isLight = useIsLight();
	const theme = useMantineTheme();
	const activeTab = useActiveTab();
	const entries = useStoreValue(state => state.config.history);

	const [ showHistory, setShowHistory ] = useState(false);
	
	return (
		<Panel
            title="History"
            icon={mdiHistory}
        >
			<ScrollArea
				style={{
					position: 'absolute',
					insetBlock: 0,
					right: 0,
					left: 0,
					top: 0
				}}
			>
				{JSON.stringify(entries)}
			</ScrollArea>
		</Panel>
	);
}