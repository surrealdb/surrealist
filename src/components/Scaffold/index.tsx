import classes from "./style.module.scss";

import { Box, Button, Center, Flex, Stack, Text } from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";
import { Suspense, lazy } from "react";
import {
	HtmlPortalNode,
	InPortal,
	OutPortal,
	createHtmlPortalNode,
} from "react-reverse-portal";
import { adapter } from "~/adapter";
import { useBoolean } from "~/hooks/boolean";
import { useSetting } from "~/hooks/config";
import { useCompatHotkeys } from "~/hooks/hotkey";
import { useIsLight } from "~/hooks/theme";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { ViewMode } from "~/types";
import { isMobile } from "~/util/helpers";
import { iconOpen } from "~/util/icons";
import { themeColor } from "~/util/mantine";
import { Icon } from "../Icon";
import { Sidebar } from "../Sidebar";
import { SurrealistLogo } from "../SurrealistLogo";
import { Toolbar } from "../Toolbar";
import { useWindowSettings } from "./hooks";
import { ChangelogModal } from "./modals/changelog";
import { ConnectionEditor } from "./modals/connection";
import { DownloadModal } from "./modals/download";
import { EmbedderModal } from "./modals/embedder";
import { LegacyModal } from "./modals/legacy";
import { CommandPaletteModal } from "./modals/palette";
import { SandboxModal } from "./modals/sandbox";
import { ScopeSignup } from "./modals/signup";
import { TableCreator } from "./modals/table";
import { Settings } from "./settings";
import { StartScreen } from "./start";

const PORTAL_ATTRS = {
	attributes: {
		style: "height: 100%",
	},
};

const VIEW_PORTALS: Record<ViewMode, HtmlPortalNode> = {
	query: createHtmlPortalNode(PORTAL_ATTRS),
	explorer: createHtmlPortalNode(PORTAL_ATTRS),
	designer: createHtmlPortalNode(PORTAL_ATTRS),
	authentication: createHtmlPortalNode(PORTAL_ATTRS),
	functions: createHtmlPortalNode(PORTAL_ATTRS),
	models: createHtmlPortalNode(PORTAL_ATTRS),
	documentation: createHtmlPortalNode(PORTAL_ATTRS),
};

const QueryView = lazy(() => import("~/views/query/QueryView"));
const ExplorerView = lazy(() => import("~/views/explorer/ExplorerView"));
const DesignerView = lazy(() => import("~/views/designer/DesignerView"));
const AuthenticationView = lazy(
	() => import("~/views/authentication/AuthenticationView"),
);
const FunctionsView = lazy(() => import("~/views/functions/FunctionsView"));
const ModelsView = lazy(() => import("~/views/models/ModelsView"));
const DocumentationView = lazy(
	() => import("~/views/documentation/DocumentationView"),
);

export function Scaffold() {
	const isLight = useIsLight();

	const [mode] = useSetting("appearance", "sidebarMode");

	const title = useInterfaceStore((s) => s.title);
	const activeConnection = useConfigStore((s) => s.activeConnection);
	const activeView = useConfigStore((s) => s.activeView);

	const [showPalette, paletteHandle] = useBoolean();
	const [showSettings, settingsHandle] = useDisclosure();
	const [showDownload, downloadHandle] = useDisclosure();

	const viewNode = VIEW_PORTALS[activeView];

	useWindowSettings();
	useCompatHotkeys([["mod+K", paletteHandle.open]]);

	return (
		<div
			className={classes.root}
			style={{
				backgroundColor: isLight
					? activeConnection
						? themeColor("slate.0")
						: "white"
					: activeConnection
						? themeColor("slate.9")
						: "black",
			}}
		>
			{!adapter.hasTitlebar && (
				<Center data-tauri-drag-region className={classes.titlebar}>
					{title}
				</Center>
			)}

			{isMobile() && (
				<Center pos="fixed" inset={0} bg="slate.9" style={{ zIndex: 1000 }}>
					<Stack maw={250} mx="auto">
						<SurrealistLogo />

						<Text c="bright" mt="lg">
							Surrealist is the ultimate way to visually manage your SurrealDB
							database
						</Text>

						<Text c="slate.3">
							Support for Surrealist on mobile platforms is currently
							unavailable, however you can visit Surrealist on a desktop
							environment to get started.
						</Text>

						<Button
							mt="lg"
							variant="gradient"
							onClick={() =>
								adapter.openUrl("https://surrealdb.com/surrealist")
							}
							rightSection={<Icon path={iconOpen} />}
						>
							Read more about Surrealist
						</Button>
					</Stack>
				</Center>
			)}

			<Flex direction="column" flex={1} pos="relative">
				{activeConnection ? (
					<>
						<Sidebar
							mode={mode}
							onToggleSettings={settingsHandle.toggle}
							onTogglePalette={paletteHandle.toggle}
							onToggleDownload={downloadHandle.toggle}
						/>

						<Toolbar sidebarMode={mode} />

						<Box p="sm" className={classes.wrapper}>
							<Box w={mode === "wide" ? 190 : 49} />
							<Box className={classes.content}>
								{viewNode && <OutPortal node={viewNode} />}
							</Box>
						</Box>

						<InPortal node={VIEW_PORTALS.query}>
							<Suspense fallback={null}>
								<QueryView />
							</Suspense>
						</InPortal>

						<InPortal node={VIEW_PORTALS.explorer}>
							<Suspense fallback={null}>
								<ExplorerView />
							</Suspense>
						</InPortal>

						<InPortal node={VIEW_PORTALS.designer}>
							<Suspense fallback={null}>
								<DesignerView />
							</Suspense>
						</InPortal>

						<InPortal node={VIEW_PORTALS.authentication}>
							<Suspense fallback={null}>
								<AuthenticationView />
							</Suspense>
						</InPortal>

						<InPortal node={VIEW_PORTALS.functions}>
							<Suspense fallback={null}>
								<FunctionsView />
							</Suspense>
						</InPortal>

						<InPortal node={VIEW_PORTALS.models}>
							<Suspense fallback={null}>
								<ModelsView />
							</Suspense>
						</InPortal>

						<InPortal node={VIEW_PORTALS.documentation}>
							<Suspense fallback={null}>
								<DocumentationView />
							</Suspense>
						</InPortal>
					</>
				) : (
					<StartScreen />
				)}
			</Flex>

			{activeConnection && (
				<>
					<ScopeSignup />
					<TableCreator />
				</>
			)}

			<ConnectionEditor />
			<LegacyModal />
			<SandboxModal />
			<ChangelogModal />
			<EmbedderModal />

			<CommandPaletteModal opened={showPalette} onClose={paletteHandle.close} />

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
