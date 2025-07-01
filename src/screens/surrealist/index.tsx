import classes from "./style.module.scss";

import { Box, Drawer, Flex, Group, Stack } from "@mantine/core";
import { type FC, Suspense, memo, useLayoutEffect } from "react";
import { HtmlPortalNode, InPortal, OutPortal, createHtmlPortalNode } from "react-reverse-portal";
import { Redirect, Route, Switch } from "wouter";
import { adapter, isDesktop } from "~/adapter";
import { AppTitleBar } from "~/components/AppTitleBar";
import { TopGlow } from "~/components/TopGlow";
import { useIsCloudEnabled } from "~/hooks/cloud";
import { useSetting } from "~/hooks/config";
import { useAvailableViews } from "~/hooks/connection";
import { useGlowOffset } from "~/hooks/glow";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useInterfaceStore } from "~/stores/interface";
import type { ViewPage } from "~/types";
import { ChatPage } from "./pages/Chat";
import { CreateConnectionPage } from "./pages/CreateConnection";
import { CreateOrganizationPage } from "./pages/CreateOrganization";
import { NewEmbedPage } from "./pages/NewEmbed";
import { OrganizationDeployPage } from "./pages/OrganizationDeploy";
import { OrganizationManagePage } from "./pages/OrganizationManage";
import { OrganizationsPage } from "./pages/Organizations";
import { OverviewPage } from "./pages/Overview";
import { ReferralPage } from "./pages/Referral";
import { SigninPage } from "./pages/Signin";
import { SupportPage } from "./pages/Support";
import { SurrealistSidebar } from "./sidebar";
import { SurrealistToolbar } from "./toolbar";
import AuthenticationView from "./views/authentication/AuthenticationView";
import DashboardView from "./views/dashboard/DashboardView";
import DesignerView from "./views/designer/DesignerView";
import DocumentationView from "./views/documentation/DocumentationView";
import ExplorerView from "./views/explorer/ExplorerView";
import FunctionsView from "./views/functions/FunctionsView";
import GraphqlView from "./views/graphql/GraphqlView";
import ModelsView from "./views/models/ModelsView";
import QueryView from "./views/query/QueryView";
import SidekickView from "./views/sidekick/SidekickView";

const DatabaseSidebarLazy = memo(SurrealistSidebar);
const OverviewPageLazy = memo(OverviewPage);
const ChatPageLazy = memo(ChatPage);
const NewEmbedPageLazy = memo(NewEmbedPage);
const OrganizationsPageLazy = memo(OrganizationsPage);
const OrganizationManagePageLazy = memo(OrganizationManagePage);
const OrganizationDeployPageLazy = memo(OrganizationDeployPage);
const ReferralPageLazy = memo(ReferralPage);
const SupportPageLazy = memo(SupportPage);
const CreateConnectionPageLazy = memo(CreateConnectionPage);
const CreateOrganizationsPageLazy = memo(CreateOrganizationPage);
const SigninPageLazy = memo(SigninPage);

const PORTAL_OPTIONS = {
	attributes: {
		style: "height: 100%; display: flex; flex-direction: column;",
	},
};

const VIEW_PORTALS: Record<ViewPage, HtmlPortalNode> = {
	dashboard: createHtmlPortalNode(PORTAL_OPTIONS),
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
	dashboard: memo(DashboardView),
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
	const showCloud = useIsCloudEnabled();
	const overlaySidebar = useInterfaceStore((s) => s.overlaySidebar);
	const title = useInterfaceStore((s) => s.title);
	const views = useAvailableViews();

	const [sidebarMode] = useSetting("appearance", "sidebarMode");
	const isMacos = adapter.platform === "darwin" && isDesktop;
	const isOtherOS = adapter.platform !== "darwin" && isDesktop;

	const onCloseSidebar = useStable(() => {
		setOverlaySidebar(false);
	});

	const glowOffset = useGlowOffset();
	const sidebarOffset = 25 + (sidebarMode === "wide" ? 190 : 49);

	useLayoutEffect(() => {
		const body = document.body;

		body.style.setProperty("--sidebar-offset", `${sidebarOffset}px`);
		body.style.setProperty("--titlebar-offset", `${adapter.titlebarOffset}px`);
	}, [sidebarOffset]);

	return (
		<Box
			className={classes.root}
			bg={isLight ? "white" : "slate.9"}
		>
			{isOtherOS && <AppTitleBar />}
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
					{isMacos && (
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
						className={classes.pageContent}
						pos="relative"
						gap="lg"
					>
						<TopGlow offset={glowOffset} />

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

							<Route path="/mini/new">
								<NewEmbedPageLazy />
							</Route>

							<Route path="/connections/create">
								<CreateConnectionPageLazy />
							</Route>

							<Route path="/support">
								<SupportPageLazy />
							</Route>

							{showCloud && (
								<>
									<Route path="/organisations/create">
										<CreateOrganizationsPageLazy />
									</Route>

									<Route path="/organisations">
										<OrganizationsPageLazy />
									</Route>

									<Route path="/o/:organization/deploy">
										{({ organization }) => (
											<OrganizationDeployPageLazy id={organization} />
										)}
									</Route>

									<Route path="/o/:organization/:tab">
										{({ organization, tab }) => (
											<OrganizationManagePageLazy
												id={organization}
												tab={tab}
											/>
										)}
									</Route>

									<Route path="/o/:organization">
										{({ organization }) => (
											<Redirect to={`/o/${organization}/instances`} />
										)}
									</Route>

									<Route path="/chat">
										<ChatPageLazy />
									</Route>

									<Route path="/referrals">
										<ReferralPageLazy />
									</Route>

									<Route path="/signin/:plan?">
										{({ plan }) => <SigninPageLazy plan={plan} />}
									</Route>

									<Route path="/cloud">
										<Redirect to="/signin" />
									</Route>

									<Route path="/billing">
										<Redirect to="/organisations" />
									</Route>
								</>
							)}

							<Route path="/c/:connection/:view">
								{({ view }) => {
									const _view = view as ViewPage;
									const portal = views[_view] ? VIEW_PORTALS[_view] : undefined;

									return (
										<>
											{Object.values(views).map((mode) => {
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
