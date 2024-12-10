import { Box } from "@mantine/core";
import { ReactFlowProvider } from "@xyflow/react";
import { memo, useEffect } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";
import { Icon } from "~/components/Icon";
import { PanelDragger } from "~/components/Pane/dragger";
import { useActiveConnection, useIsConnected } from "~/hooks/connection";
import { usePanelMinSize } from "~/hooks/panels";
import { useIntent, useViewFocus } from "~/hooks/routing";
import { useTables } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { useDesigner } from "~/providers/Designer";
import { TablesPane } from "~/screens/surrealist/components/TablesPane";
import { useConfigStore } from "~/stores/config";
import { iconDesigner, iconEye } from "~/util/icons";
import { dispatchIntent } from "~/util/intents";
import { syncConnectionSchema } from "~/util/schema";
import { TableGraphPane } from "../TableGraphPane";

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
		{
			key: "open",
			title: "Focus table",
			icon: <Icon path={iconEye} />,
			onClick: () => dispatchIntent("focus-table", { table }),
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

	useViewFocus("designer", () => {
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
