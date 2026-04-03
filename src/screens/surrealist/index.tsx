import { Box, Drawer, Flex, Group, Stack } from "@mantine/core";
import { memo, useLayoutEffect } from "react";
import { Redirect, Route, Switch } from "wouter";
import { adapter, isDesktop } from "~/adapter";
import { AppTitleBar } from "~/components/AppTitleBar";
import { TopGlow } from "~/components/TopGlow";
import { useIsCloudEnabled } from "~/hooks/cloud";
import { useSetting } from "~/hooks/config";
import { useGlowOffset } from "~/hooks/glow";
import { useStable } from "~/hooks/stable";
import { useInterfaceStore } from "~/stores/interface";
import { ViewPage } from "~/types";
import { ConnectionPage } from "./pages/Connection";
import { ConnectionSidebar } from "./pages/Connection/sidebar";
import { CreateConnectionPage } from "./pages/CreateConnection";
import { CreateOrganizationPage } from "./pages/CreateOrganization";
import { NewEmbedPage } from "./pages/NewEmbed";
import { OrganizationPage } from "./pages/Organization";
import { OrganisationSidebar } from "./pages/Organization/sidebar";
import { OrganizationDeployPage } from "./pages/OrganizationDeploy";
import { OverviewPage } from "./pages/Overview";
import { ReferralPage } from "./pages/Referral";
import { SigninPage } from "./pages/Signin";
import { SupportPage } from "./pages/Support";
import { ArticlePage } from "./pages/Support/ArticlePage";
import { CollectionPage } from "./pages/Support/CollectionPage";
import { ConversationPage } from "./pages/Support/ConversationPage";
import { RequestsPage } from "./pages/Support/RequestsPage";
import { SupportPlansPage } from "./pages/SupportPlans";
import { SurrealistSidebar } from "./sidebar";
import { GlobalSidebar } from "./sidebar/global";
import { SidebarProvider } from "./sidebar/portal";
import classes from "./style.module.scss";
import { SurrealistToolbar } from "./toolbar";

const DatabaseSidebarLazy = memo(SurrealistSidebar);

const OverviewPageLazy = memo(OverviewPage);
const ConnectionPageLazy = memo(ConnectionPage);
const NewEmbedPageLazy = memo(NewEmbedPage);
const OrganizationPageLazy = memo(OrganizationPage);
const OrganizationDeployPageLazy = memo(OrganizationDeployPage);
const SupportPlansPageLazy = memo(SupportPlansPage);
const ReferralPageLazy = memo(ReferralPage);
const SupportPageLazy = memo(SupportPage);
const RequestsPageLazy = memo(RequestsPage);
const CreateConnectionPageLazy = memo(CreateConnectionPage);
const CreateOrganizationsPageLazy = memo(CreateOrganizationPage);
const SigninPageLazy = memo(SigninPage);

export function SurrealistScreen() {
	const { setOverlaySidebar } = useInterfaceStore.getState();

	const showCloud = useIsCloudEnabled();
	const overlaySidebar = useInterfaceStore((s) => s.overlaySidebar);
	const title = useInterfaceStore((s) => s.title);

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
		<SidebarProvider sidebarMode={sidebarMode}>
			<Box
				className={classes.root}
				bg="var(--mantine-color-body)"
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

						<TopGlow offset={glowOffset} />

						<Stack
							flex={1}
							className={classes.pageContent}
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
									<GlobalSidebar />
									<OverviewPageLazy />
								</Route>

								<Route path="/mini/new">
									<GlobalSidebar />
									<NewEmbedPageLazy />
								</Route>

								<Route path="/connections/create">
									<GlobalSidebar />
									<CreateConnectionPageLazy />
								</Route>

								<Route path="/support">
									<GlobalSidebar />
									<SupportPageLazy />
								</Route>

								<Route path="/support/collections/:collection">
									{({ collection }) => (
										<>
											<GlobalSidebar />
											<CollectionPage id={collection} />
										</>
									)}
								</Route>

								<Route path="/support/articles/:article">
									{({ article }) => (
										<>
											<GlobalSidebar />
											<ArticlePage id={article} />
										</>
									)}
								</Route>

								<Route path="/support/requests">
									<GlobalSidebar />
									<RequestsPageLazy />
								</Route>

								<Route path="/support/conversations/:conversation">
									{({ conversation }) => (
										<>
											<GlobalSidebar />
											<ConversationPage id={conversation} />
										</>
									)}
								</Route>

								{showCloud && (
									<>
										<Route path="/organisations/create">
											<GlobalSidebar />
											<CreateOrganizationsPageLazy />
										</Route>

										<Route path="/organisations">
											<Redirect to="/overview" />
										</Route>

										<Route path="/o/:organization/deploy">
											{({ organization }) => (
												<>
													<OrganisationSidebar
														organizationId={organization}
													/>
													<OrganizationDeployPageLazy id={organization} />
												</>
											)}
										</Route>

										<Route path="/o/:organization/support-plans">
											{({ organization }) => (
												<>
													<OrganisationSidebar
														organizationId={organization}
													/>
													<SupportPlansPageLazy id={organization} />
												</>
											)}
										</Route>

										<Route path="/o/:organization/:tab">
											{({ organization, tab }) => (
												<>
													<OrganisationSidebar
														organizationId={organization}
													/>
													<OrganizationPageLazy
														id={organization}
														tab={tab}
													/>
												</>
											)}
										</Route>

										<Route path="/o/:organization">
											{({ organization }) => (
												<Redirect to={`/o/${organization}/overview`} />
											)}
										</Route>

										<Route path="/referrals">
											<GlobalSidebar />
											<ReferralPageLazy />
										</Route>

										<Route path="/signin/:plan?">
											{({ plan }) => (
												<>
													<GlobalSidebar />
													<SigninPageLazy plan={plan} />
												</>
											)}
										</Route>

										<Route path="/cloud">
											<Redirect to="/signin" />
										</Route>

										<Route path="/billing">
											<Redirect to="/overview" />
										</Route>
									</>
								)}

								<Route path="/c/:connection/:view">
									{({ view }) => (
										<>
											<ConnectionSidebar />
											<ConnectionPageLazy view={view as ViewPage} />
										</>
									)}
								</Route>

								<Route>
									<Redirect to="/overview" />
								</Route>
							</Switch>
						</Stack>
					</Box>
				</Flex>

				<Drawer
					withCloseButton={false}
					opened={overlaySidebar}
					onClose={onCloseSidebar}
					size={215}
				>
					<DatabaseSidebarLazy sidebarMode="fill" />
				</Drawer>
			</Box>
		</SidebarProvider>
	);
}
