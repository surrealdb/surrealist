import { memo, useEffect } from "react";
import { TableGraphPane } from "../TableGraphPane";
import { useTables } from "~/hooks/schema";
import { syncDatabaseSchema } from "~/util/schema";
import { ReactFlowProvider } from "reactflow";
import { useActiveConnection, useIsConnected } from "~/hooks/connection";
import { useIntent } from "~/hooks/url";
import { useViewEffect } from "~/hooks/view";
import { PanelDragger } from "~/components/Pane/dragger";
import { Panel, PanelGroup } from "react-resizable-panels";
import { Box } from "@mantine/core";
import { TablesPane } from "~/screens/database/components/TablesPane";
import { usePanelMinSize } from "~/hooks/panels";
import { iconDesigner } from "~/util/icons";
import { useDesigner } from "~/providers/Designer";
import { useStable } from "~/hooks/stable";
import { Icon } from "~/components/Icon";

const TableGraphPaneLazy = memo(TableGraphPane);

export interface DesignerViewProps {
}

export function DesignerView(_props: DesignerViewProps) {
	const { design, stopDesign, active, isDesigning } = useDesigner();
	const { designerTableList } = useActiveConnection();

	const isOnline = useIsConnected();
	const tables = useTables();

	const buildContextMenu = useStable((table: string) => [
		{
			key: 'open',
			title: "Open designer",
			icon: <Icon path={iconDesigner} />,
			onClick: () => design(table)
		}
	]);

	useEffect(() => {
		if (!isOnline) {
			stopDesign();
		}
	}, [isOnline, stopDesign]);

	useIntent("design-table", ({ table }) => {
		design(table);
	});

	useViewEffect("designer", () => {
		syncDatabaseSchema();
	});

	const [minSize, ref] = usePanelMinSize(275);

	return (
		<>
			<Box h="100%" ref={ref}>
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
								/>
							</Panel>
							<PanelDragger />
						</>
					)}
					<Panel minSize={minSize} order={2}>
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