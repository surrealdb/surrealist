import classes from "./style.module.scss";

import {
	Box,
	Center,
	Flex,
} from "@mantine/core";

import { useStable } from "~/hooks/stable";
import { Toolbar } from "../Toolbar";
import { getHotkeyHandler, useDisclosure } from "@mantine/hooks";
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
import { Settings } from "./settings";
import { useIsLight } from "~/hooks/theme";
import { themeColor } from "~/util/mantine";
import { adapter } from "~/adapter";
import { FreshExperience } from "./fresh";
import { TableCreator } from "./modals/table";
import { DownloadModal } from "./modals/download";
import { ScopeSignup } from "./modals/signup";
import { DocumentationView } from "~/views/documentation/DocumentationView";
import { Sidebar } from "../Sidebar";
import { CommandPaletteModal } from "./modals/palette";
import { useEffect } from "react";
import { useBoolean } from "~/hooks/boolean";

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
	models: createHtmlPortalNode(PORTAL_ATTRS),
	documentation: createHtmlPortalNode(PORTAL_ATTRS),
};

export function Scaffold() {
	const isLight = useIsLight();

	const title = useInterfaceStore((s) => s.title);
	const activeConnection = useConfigStore((s) => s.activeConnection);
	const activeView = useConfigStore((s) => s.activeView);

	const [showPalette, paletteHandle] = useBoolean();
	const [showSettings, settingsHandle] = useDisclosure();
	const [showDownload, downloadHandle] = useDisclosure();

	const viewNode = VIEW_PORTALS[activeView];

	const userExecuteQuery = useStable(() => {
		executeQuery({
			loader: true
		});
	});

	useEffect(() => {
		const handle = (e: any) => {

			// NOTE See https://github.com/xyflow/xyflow/issues/3924
			e.stopPropagation();

			getHotkeyHandler([
				["F9", () => userExecuteQuery()],
				["mod+Enter", () => userExecuteQuery()],
				["mod+K", paletteHandle.open],
			])(e);
		};

		document.body.addEventListener('keydown', handle);

		return () => {
			document.body.removeEventListener('keydown', handle);
		};
	}, []);

	return (
		<div
			className={classes.root}
			style={{
				backgroundColor: isLight ? themeColor("slate.0") : themeColor("slate.9")
			}}
		>
			{!adapter.hasTitlebar && (
				<Center
					data-tauri-drag-region
					className={classes.titlebar}
				>
					{title}
				</Center>
			)}

			<Flex
				direction="column"
				flex={1}
				pos="relative"
			>
				<Sidebar
					onToggleSettings={settingsHandle.toggle}
					onTogglePalette={paletteHandle.toggle}
					onToggleDownload={downloadHandle.toggle}
				/>

				<Toolbar />

				{activeConnection ? (
					<>
						<Box p="sm" className={classes.wrapper}>
							<Box w={49} />
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

						<InPortal node={VIEW_PORTALS.documentation}>
							<DocumentationView />
						</InPortal>
					</>
				) : (
					<FreshExperience
						onClickSettings={settingsHandle.toggle}
					/>
				)}
			</Flex>

			{activeConnection && (
				<>
					<ScopeSignup />
					<TableCreator />
				</>
			)}

			<ConnectionEditor />

			<CommandPaletteModal
				opened={showPalette}
				onClose={paletteHandle.close}
			/>

			<Settings
				opened={showSettings}
				onClose={settingsHandle.close}
				onOpen={settingsHandle.open}
			/>

			<DownloadModal
				opened={showDownload}
				onClose={downloadHandle.close}
				onOpen={downloadHandle.open}
			/>
		</div>
	);
}
