import classes from "./style.module.scss";
import clsx from "clsx";

import {
	type HtmlPortalNode,
	InPortal,
	OutPortal,
	createHtmlPortalNode,
} from "react-reverse-portal";

import { Alert, Box, Center, Drawer, Flex, Group, Paper, ScrollArea, Stack, Text } from "@mantine/core";
import { Suspense, lazy, memo, useLayoutEffect, useState } from "react";
import { adapter, isDesktop } from "~/adapter";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { VIEW_MODES } from "~/constants";
import { useBoolean } from "~/hooks/boolean";
import { useLogoUrl } from "~/hooks/brand";
import { useSetting } from "~/hooks/config";
import { useActiveConnection, useIsConnected } from "~/hooks/connection";
import { useIsLight } from "~/hooks/theme";
import { CloudView } from "~/screens/cloud-manage/view";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import type { ViewMode } from "~/types";
import { iconWarning } from "~/util/icons";
import { themeColor } from "~/util/mantine";
import { SelectDatabase } from "./components/SelectDatabase";
import { DatabaseToolbar } from "./toolbar";
import { DatabaseSidebar } from "./sidebar";
import { useStable } from "~/hooks/stable";

const PORTAL_ATTRS = {
	attributes: {
		style: "height: 100%; display: flex; flex-direction: column;",
	},
};

const VIEW_PORTALS: Record<ViewMode, HtmlPortalNode> = {
	query: createHtmlPortalNode(PORTAL_ATTRS),
	explorer: createHtmlPortalNode(PORTAL_ATTRS),
	graphql: createHtmlPortalNode(PORTAL_ATTRS),
	designer: createHtmlPortalNode(PORTAL_ATTRS),
	authentication: createHtmlPortalNode(PORTAL_ATTRS),
	functions: createHtmlPortalNode(PORTAL_ATTRS),
	models: createHtmlPortalNode(PORTAL_ATTRS),
	documentation: createHtmlPortalNode(PORTAL_ATTRS),
	cloud: createHtmlPortalNode(PORTAL_ATTRS),
};

const DatabaseSidebarLazy = memo(DatabaseSidebar);

const QueryView = lazy(() => import("./views/query/QueryView"));
const ExplorerView = lazy(() => import("./views/explorer/ExplorerView"));
const GraphqlView = lazy(() => import("./views/graphql/GraphqlView"));
const DesignerView = lazy(() => import("./views/designer/DesignerView"));
const AuthenticationView = lazy(() => import("./views/authentication/AuthenticationView"));
const FunctionsView = lazy(() => import("./views/functions/FunctionsView"));
const ModelsView = lazy(() => import("./views/models/ModelsView"));
const DocumentationView = lazy(() => import("./views/documentation/DocumentationView"));

export function DatabaseScreen() {
	const { setOverlaySidebar } = useInterfaceStore.getState();

	const isLight = useIsLight();
	const isConnected = useIsConnected();
	const connection = useActiveConnection();
	const overlaySidebar = useInterfaceStore((s) => s.overlaySidebar);
	const title = useInterfaceStore((s) => s.title);

	const [sidebarMode] = useSetting("appearance", "sidebarMode");
	const customTitlebar = adapter.platform === "darwin" && isDesktop;

	const viewMode = useConfigStore((s) => s.activeView);
	const viewNode = VIEW_PORTALS[viewMode];
	const viewInfo = VIEW_MODES[viewMode];

	const onCloseSidebar = useStable(() => {
		setOverlaySidebar(false);
	});

	const [loaded, setLoaded] = useState<ViewMode[]>([]);

	useLayoutEffect(() => {
		setLoaded((prev) => {
			if (!prev.includes(viewMode)) {
				return [...prev, viewMode];
			}

			return prev;
		});
	}, [viewMode]);

	const requireDatabase = !connection?.lastDatabase && viewInfo?.require === "database";
	const sidebarOffset = 25 + (sidebarMode === "wide" ? 190 : 49);

	return (
		<div
			className={classes.root}
			style={{
				backgroundColor: isLight
					? connection
						? themeColor("slate.0")
						: "white"
					: connection
						? themeColor("slate.9")
						: "black",
			}}
		>
			{customTitlebar && (
				<Flex
					data-tauri-drag-region
					className={classes.titlebar}
					justify="center"
					align="end"
				>
					{title}
				</Flex>
			)}

			<Flex
				direction="column"
				flex={1}
				pos="relative"
			>
				<DatabaseSidebarLazy
					sidebarMode={sidebarMode}
					withTitlebarOffset={customTitlebar}
					visibleFrom="md"
				/>

				<Box
					m="lg"
					mt={customTitlebar ? "sm" : "lg"}
					className={classes.wrapper}
					__vars={{
						'--offset': `${sidebarOffset}px`
					}}
				>
					{viewMode !== "cloud" && (
						<Group
							gap="md"
							pos="relative"
							align="center"
							wrap="nowrap"
							className={classes.toolbar}
						>
							<DatabaseToolbar />
						</Group>
					)}
					<Stack
						flex={1}
						pos="relative"
					>
						{requireDatabase ? (
							<Center flex={1}>
								<Paper
									radius="md"
									p="xl"
									w={500}
								>
									<PrimaryTitle>Before you continue...</PrimaryTitle>
									<Text mt="md">
										Please select a namespace and database before accessing the{" "}
										{viewInfo?.name} view. You can use the buttons below to
										choose an existing namespace and database, or create new
										ones.
									</Text>
									<SelectDatabase mt="xl" />
									{!isConnected && (
										<Alert
											mt="xl"
											color="orange"
											icon={<Icon path={iconWarning} />}
										>
											You must be connected before selecting a namespace and
											database
										</Alert>
									)}
								</Paper>
							</Center>
						) : (
							viewNode && <OutPortal node={viewNode} />
						)}

						{loaded.includes("cloud") && (
							<InPortal node={VIEW_PORTALS.cloud}>
								<Suspense fallback={null}>
									<CloudView />
								</Suspense>
							</InPortal>
						)}

						{loaded.includes("query") && (
							<InPortal node={VIEW_PORTALS.query}>
								<Suspense fallback={null}>
									<QueryView />
								</Suspense>
							</InPortal>
						)}

						{loaded.includes("explorer") && (
							<InPortal node={VIEW_PORTALS.explorer}>
								<Suspense fallback={null}>
									<ExplorerView />
								</Suspense>
							</InPortal>
						)}

						{loaded.includes("graphql") && (
							<InPortal node={VIEW_PORTALS.graphql}>
								<Suspense fallback={null}>
									<GraphqlView />
								</Suspense>
							</InPortal>
						)}

						{loaded.includes("designer") && (
							<InPortal node={VIEW_PORTALS.designer}>
								<Suspense fallback={null}>
									<DesignerView />
								</Suspense>
							</InPortal>
						)}

						{loaded.includes("authentication") && (
							<InPortal node={VIEW_PORTALS.authentication}>
								<Suspense fallback={null}>
									<AuthenticationView />
								</Suspense>
							</InPortal>
						)}

						{loaded.includes("functions") && (
							<InPortal node={VIEW_PORTALS.functions}>
								<Suspense fallback={null}>
									<FunctionsView />
								</Suspense>
							</InPortal>
						)}

						{loaded.includes("models") && (
							<InPortal node={VIEW_PORTALS.models}>
								<Suspense fallback={null}>
									<ModelsView />
								</Suspense>
							</InPortal>
						)}

						{loaded.includes("documentation") && (
							<InPortal node={VIEW_PORTALS.documentation}>
								<Suspense fallback={null}>
									<DocumentationView />
								</Suspense>
							</InPortal>
						)}
					</Stack>
				</Box>
			</Flex>

			<Drawer
				opened={overlaySidebar}
				onClose={onCloseSidebar}
				size={275}
			>
				<DatabaseSidebarLazy
					sidebarMode="fill"
					withTitlebarOffset={customTitlebar}
				/>
			</Drawer>
		</div>
	);
}
