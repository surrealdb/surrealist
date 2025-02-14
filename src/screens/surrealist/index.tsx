import classes from "./style.module.scss";

import { Box, Drawer, Flex, Group, Stack } from "@mantine/core";
import { type FC, Suspense, memo } from "react";
import { HtmlPortalNode, InPortal, OutPortal, createHtmlPortalNode } from "react-reverse-portal";
import { Redirect, Route, Switch } from "wouter";
import { adapter, isDesktop } from "~/adapter";
import { VIEW_PAGES } from "~/constants";
import { useSetting } from "~/hooks/config";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useInterfaceStore } from "~/stores/interface";
import type { ViewPage } from "~/types";
import { SurrealistSidebar } from "./sidebar";
import { OverviewPage } from "./pages/Overview";
import { BillingPage } from "./pages/Billing";
import { ChatPage } from "./pages/Chat";
import { SurrealistToolbar } from "./toolbar";
import AuthenticationView from "./views/authentication/AuthenticationView";
import DesignerView from "./views/designer/DesignerView";
import DocumentationView from "./views/documentation/DocumentationView";
import ExplorerView from "./views/explorer/ExplorerView";
import FunctionsView from "./views/functions/FunctionsView";
import GraphqlView from "./views/graphql/GraphqlView";
import ModelsView from "./views/models/ModelsView";
import QueryView from "./views/query/QueryView";
import SidekickView from "./views/sidekick/SidekickView";
import PlaceholderPage from "./cloud-panel/pages/Placeholder";

const DatabaseSidebarLazy = memo(SurrealistSidebar);
const OverviewPageLazy = memo(OverviewPage);
const BillingPageLazy = memo(BillingPage);
const ChatPageLazy = memo(ChatPage);

const PORTAL_OPTIONS = {
	attributes: {
		style: "height: 100%; display: flex; flex-direction: column;",
	},
};

const VIEW_PORTALS: Record<ViewPage, HtmlPortalNode> = {
	query: createHtmlPortalNode(PORTAL_OPTIONS),
	explorer: createHtmlPortalNode(PORTAL_OPTIONS),
	graphql: createHtmlPortalNode(PORTAL_OPTIONS),
	designer: createHtmlPortalNode(PORTAL_OPTIONS),
	authentication: createHtmlPortalNode(PORTAL_OPTIONS),
	functions: createHtmlPortalNode(PORTAL_OPTIONS),
	models: createHtmlPortalNode(PORTAL_OPTIONS),
	sidekick: createHtmlPortalNode(PORTAL_OPTIONS),
	documentation: createHtmlPortalNode(PORTAL_OPTIONS),
};

const VIEW_COMPONENTS: Record<ViewPage, FC> = {
	query: memo(QueryView),
	explorer: memo(ExplorerView),
	graphql: memo(GraphqlView),
	designer: memo(DesignerView),
	authentication: memo(AuthenticationView),
	functions: memo(FunctionsView),
	models: memo(ModelsView),
	sidekick: memo(SidekickView),
	documentation: memo(DocumentationView),
};

export function SurrealistScreen() {
	const { setOverlaySidebar } = useInterfaceStore.getState();

	const isLight = useIsLight();
	const overlaySidebar = useInterfaceStore((s) => s.overlaySidebar);
	const title = useInterfaceStore((s) => s.title);

	const [sidebarMode] = useSetting("appearance", "sidebarMode");
	const customTitlebar = adapter.platform === "darwin" && isDesktop;

	const onCloseSidebar = useStable(() => {
		setOverlaySidebar(false);
	});

	const sidebarOffset = 25 + (sidebarMode === "wide" ? 190 : 49);
	const titlebarOffset = customTitlebar ? 15 : 0;

	return (
		<Box
			className={classes.root}
			bg={isLight ? "slate.0" : "slate.9"}
			__vars={{
				"--sidebar-offset": `${sidebarOffset}px`,
				"--titlebar-offset": `${titlebarOffset}px`,
			}}
		>
			<Flex
				direction="column"
				flex={1}
				pos="relative"
			>
				<DatabaseSidebarLazy
					sidebarMode={sidebarMode}
					visibleFrom="md"
				/>

				<Box className={classes.wrapper}>
					{customTitlebar && (
						<Flex
							data-tauri-drag-region
							className={classes.titlebar}
							justify="center"
							align="center"
						>
							{title}
						</Flex>
					)}

					<Stack
						flex={1}
						pos="relative"
						gap="lg"
					>
						<Group
							gap="md"
							pos="absolute"
							left={0}
							right={0}
							top={0}
							align="center"
							wrap="nowrap"
							className={classes.toolbar}
						>
							<SurrealistToolbar />
						</Group>

						<Switch>
							<Route path="/" />

							<Route path="/overview">
								<OverviewPageLazy />
							</Route>

							<Route path="/share">
								<PlaceholderPage />
							</Route>

							<Route path="/university">
								<PlaceholderPage />
							</Route>

							<Route path="/chat">
								<ChatPageLazy />
							</Route>

							<Route path="/billing">
								<BillingPageLazy />
							</Route>

							<Route path="/referrals">
								<PlaceholderPage />
							</Route>

							<Route path="/support">
								<PlaceholderPage />
							</Route>

							<Route path="/c/:connection/:view">
								{({ connection, view }) => {
									const portal = VIEW_PORTALS[view as ViewPage];

									console.log("portal", connection, view);

									return (
										<>
											{Object.values(VIEW_PAGES).map((mode) => {
												const Content = VIEW_COMPONENTS[mode.id];

												return (
													<InPortal
														key={mode.id}
														node={VIEW_PORTALS[mode.id]}
													>
														<Suspense fallback={null}>
															<Content />
														</Suspense>
													</InPortal>
												);
											})}

											{portal ? (
												<Stack
													className={classes.inner}
													flex={1}
													gap={0}
												>
													<OutPortal node={portal} />
												</Stack>
											) : (
												<Redirect to="/overview" />
											)}
										</>
									);
								}}
							</Route>

							<Route>
								<Redirect to="/overview" />
							</Route>
						</Switch>
					</Stack>
				</Box>
			</Flex>

			<Drawer
				opened={overlaySidebar}
				onClose={onCloseSidebar}
				size={215}
			>
				<DatabaseSidebarLazy sidebarMode="fill" />
			</Drawer>
		</Box>
	);
}

// interface DatabaseSelectionProps {
// 	info: ViewPageInfo;
// }

// function DatabaseSelection({ info }: DatabaseSelectionProps) {
// 	const isConnected = useIsConnected();

// 	return (
// 		<Center flex={1}>
// 			<Paper
// 				radius="md"
// 				p="xl"
// 				w={500}
// 			>
// 				<PrimaryTitle>Before you continue...</PrimaryTitle>
// 				<Text mt="md">
// 					Please select a namespace and database before accessing the {info?.name} view.
// 					You can use the buttons below to choose an existing namespace and database, or
// 					create new ones.
// 				</Text>
// 				<SelectDatabase
// 					withNamespace
// 					withDatabase
// 					mt="xl"
// 				/>
// 				{!isConnected && (
// 					<Alert
// 						mt="xl"
// 						color="orange"
// 						icon={<Icon path={iconWarning} />}
// 					>
// 						You must be connected before selecting a namespace and database
// 					</Alert>
// 				)}
// 			</Paper>
// 		</Center>
// 	);
// }
