import { Box } from "@mantine/core";
import { ReactFlowProvider } from "@xyflow/react";
import { memo, useEffect } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";
import { Icon } from "~/components/Icon";
import { PanelDragger } from "~/components/Pane/dragger";
import { useActiveConnection, useIsConnected } from "~/hooks/connection";
import { usePanelMinSize } from "~/hooks/panels";
import { useTables } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { useIntent } from "~/hooks/url";
import { useViewEffect } from "~/hooks/view";
import { useDesigner } from "~/providers/Designer";
import { TablesPane } from "~/screens/database/components/TablesPane";
import { iconDesigner } from "~/util/icons";
import { syncConnectionSchema } from "~/util/schema";
import { TableGraphPane } from "../TableGraphPane";
import { useConfigStore } from "~/stores/config";

const TableGraphPaneLazy = memo(TableGraphPane);

export function DesignerView() {
	const { updateCurrentConnection } = useConfigStore.getState();
	const { design, stopDesign, active, isDesigning } = useDesigner();
	const { designerTableList } = useActiveConnection();

	const isOnline = useIsConnected();
	const tables = useTables();

	const buildContextMenu = useStable((table: string) => [
		{
			key: "open",
			title: "Open designer",
			icon: <Icon path={iconDesigner} />,
			onClick: () => design(table),
		},
	]);

	const closeTableList = useStable(() => {
		updateCurrentConnection({
			designerTableList: false,
		});
	});

	useEffect(() => {
		if (!isOnline) {
			stopDesign();
		}
	}, [isOnline, stopDesign]);

	useIntent("design-table", ({ table }) => {
		design(table);
	});

	useViewEffect("designer", () => {
		syncConnectionSchema();
	});

	const [minSize, ref] = usePanelMinSize(275);

	return (
		<>
			<Box
				h="100%"
				ref={ref}
			>
				<PanelGroup
					direction="horizontal"
					style={{ opacity: minSize === 0 ? 0 : 1 }}
				>
					{designerTableList && (
						<>
							<Panel
								defaultSize={minSize}
								minSize={minSize}
								maxSize={35}
								id="tables"
								order={1}
							>
								<TablesPane
									icon={iconDesigner}
									onTableSelect={design}
									onTableContextMenu={buildContextMenu}
									onClose={closeTableList}
								/>
							</Panel>
							<PanelDragger />
						</>
					)}
					<Panel
						minSize={minSize}
						id="graph"
						order={2}
					>
						<ReactFlowProvider>
							<TableGraphPaneLazy
								tables={tables}
								active={isDesigning ? active : null}
								setActiveTable={design}
							/>
						</ReactFlowProvider>
					</Panel>
				</PanelGroup>
			</Box>
		</>
		// </Splitter>
	);
}

export default DesignerView;
