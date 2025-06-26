import { Box } from "@mantine/core";

import { Panel, PanelGroup } from "react-resizable-panels";
import { PanelDragger } from "~/components/Pane/dragger";
import { usePanelMinSize } from "~/hooks/panels";
import { ObservablePane } from "../ObservablePane";
import { useState } from "react";
import { Observable } from "~/types";
import { METRICS_OBSERVABLES } from "~/constants";

export function QueryView() {
	const [minSidebarSize, rootRef] = usePanelMinSize(275);
	const [activeObservable, setActiveObservable] = useState<Observable>(METRICS_OBSERVABLES[0]);

	return (
		<>
			<Box
				h="100%"
				ref={rootRef}
				pr="lg"
				pb="lg"
			>
				<PanelGroup
					direction="horizontal"
					style={{ opacity: minSidebarSize === 0 ? 0 : 1 }}
				>
					<Panel
						defaultSize={minSidebarSize}
						minSize={minSidebarSize}
						maxSize={35}
						id="tabs"
						order={1}
					>
						<ObservablePane
							activeObservable={activeObservable}
							onActivate={(observable) => {
								setActiveObservable(observable);
							}}
						/>
					</Panel>
					<PanelDragger />
					{/* <Panel
						id="content"
						order={2}
					>
						
					</Panel> */}
				</PanelGroup>
			</Box>
		</>
	);
}

export default QueryView;
