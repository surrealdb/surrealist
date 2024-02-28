import classes from "./style.module.scss";

import {
	Box,
	Center,
	Stack,
} from "@mantine/core";

import { useStable } from "~/hooks/stable";
import { Toolbar } from "../Toolbar";
import { useDisclosure, useHotkeys } from "@mantine/hooks";
import { ConnectionEditor } from "./modals/connection";
import { executeQuery } from "~/database";
import { InPortal, OutPortal, createHtmlPortalNode, HtmlPortalNode } from "react-reverse-portal";
import { QueryView } from "~/views/query/QueryView";
import { ViewMode } from "~/types";
import { ExplorerView } from "~/views/explorer/ExplorerView";
import { DesignerView } from "~/views/designer/DesignerView";
import { AuthenticationView } from "~/views/authentication/AuthenticationView";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { VIEW_MODES } from "~/constants";
import { ON_STOP_PROPAGATION, updateTitle } from "~/util/helpers";
import { Spacer } from "../Spacer";
import { Settings } from "../Settings";
import { useIsLight } from "~/hooks/theme";
import { themeColor } from "~/util/mantine";
import { iconCog } from "~/util/icons";
import { isDesktop } from "~/adapter";
import { FreshExperience } from "./fresh";
import { NavigationIcon } from "../NavigationIcon";
import { TableCreator } from "./modals/table";

const PORTAL_ATTRS = {
	attributes: {
		style: "height: 100%"
	}
};

const VIEW_PORTALS: Record<ViewMode, HtmlPortalNode> = {
	query: createHtmlPortalNode(PORTAL_ATTRS),
	explorer: createHtmlPortalNode(PORTAL_ATTRS),
	designer: createHtmlPortalNode(PORTAL_ATTRS),
	authentication: createHtmlPortalNode(PORTAL_ATTRS),
};

export function Scaffold() {
	const isLight = useIsLight();

	const { setActiveView } = useConfigStore.getState();

	const title = useInterfaceStore((s) => s.title);
	const activeConnection = useConfigStore((s) => s.activeConnection);
	const activeView = useConfigStore((s) => s.activeView);

	const [showSettings, settingsHandle] = useDisclosure();

	const viewNode = VIEW_PORTALS[activeView];

	const userExecuteQuery = useStable(() => {
		executeQuery({
			loader: true
		});
	});

	useHotkeys([
		["F9", () => userExecuteQuery()],
		["mod+Enter", () => userExecuteQuery()],
	]);

	const setViewMode = useStable((id: ViewMode) => {
		updateTitle();
		setActiveView(id);
	});

	return (
		<div
			className={classes.root}
			onKeyDown={ON_STOP_PROPAGATION} // NOTE See https://github.com/xyflow/xyflow/issues/3924
			style={{
				backgroundColor: isLight ? themeColor("slate.0") : themeColor("slate.9")
			}}
		>
			{isDesktop && (
				<Center
					data-tauri-drag-region
					className={classes.titlebar}
				>
					{title}
				</Center>
			)}

			<Toolbar />

			{activeConnection ? (
				<>
					<Box p="sm" className={classes.wrapper}>
						<Stack gap="xs">
							{VIEW_MODES.map((info) => {
								const isActive = info.id === activeView;

								return (
									<NavigationIcon
										key={info.id}
										name={info.name}
										isActive={isActive}
										isLight={isLight}
										icon={info.icon}
										onClick={() => setViewMode(info.id as ViewMode)}
									/>
								);
							})}

							<Spacer />

							<NavigationIcon
								name="Settings"
								isLight={isLight}
								icon={iconCog}
								onClick={settingsHandle.toggle}
							/>
						</Stack>
						<Box className={classes.content}>
							{viewNode && <OutPortal node={viewNode} />}
						</Box>
					</Box>

					<InPortal node={VIEW_PORTALS.query}>
						<QueryView />
					</InPortal>

					<InPortal node={VIEW_PORTALS.explorer}>
						<ExplorerView />
					</InPortal>

					<InPortal node={VIEW_PORTALS.designer}>
						<DesignerView />
					</InPortal>

					<InPortal node={VIEW_PORTALS.authentication}>
						<AuthenticationView />
					</InPortal>
				</>
			) : (
				<FreshExperience
					onClickSettings={settingsHandle.toggle}
				/>
			)}

			<ConnectionEditor />
			<TableCreator />

			<Settings
				opened={showSettings}
				onClose={settingsHandle.close}
			/>
		</div>
	);
}
