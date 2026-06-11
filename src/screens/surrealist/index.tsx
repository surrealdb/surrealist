import { Box, Center, Flex, Loader, LoadingOverlay, Stack } from "@mantine/core";
import { memo } from "react";
import { Redirect, Route, Switch } from "wouter";
import { adapter, isDesktop } from "~/adapter";
import globulesImg from "~/assets/images/globules.webp";
import { AppTitleBar } from "~/components/AppTitleBar";
import { CloudGuard } from "~/components/CloudGuard";
import { useIsCloudEnabled } from "~/hooks/cloud";
import { useSetting } from "~/hooks/config";
import { useCloud } from "~/providers/Cloud";
import { useInterfaceStore } from "~/stores/interface";
import { ViewPage } from "~/types";
import { ConnectionPage } from "./pages/Connection";
import { ConnectionSidebar } from "./pages/Connection/sidebar";
import { ContextPage } from "./pages/Context";
import { CreateConnectionPage } from "./pages/CreateConnection";
import { CreateOrganizationPage } from "./pages/CreateOrganization";
import { NewEmbedPage } from "./pages/NewEmbed";
import { OrganizationPage } from "./pages/Organization";
import { OrganisationSidebar } from "./pages/Organization/sidebar";
import { OrganizationContextCheckoutPage } from "./pages/OrganizationContextCheckout";
import { OrganizationContextDeployPage } from "./pages/OrganizationContextDeploy";
import { OrganizationContextPlanPage } from "./pages/OrganizationContextPlan";
import { OrganizationDeployPage } from "./pages/OrganizationDeploy";
import { OverviewPage } from "./pages/Overview";
import { ReferralPage } from "./pages/Referral";
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
const OrganizationContextDeployPageLazy = memo(OrganizationContextDeployPage);
const OrganizationContextPlanPageLazy = memo(OrganizationContextPlanPage);
const OrganizationContextCheckoutPageLazy = memo(OrganizationContextCheckoutPage);
const SupportPlansPageLazy = memo(SupportPlansPage);
const ReferralPageLazy = memo(ReferralPage);
const SupportPageLazy = memo(SupportPage);
const RequestsPageLazy = memo(RequestsPage);
const CreateConnectionPageLazy = memo(CreateConnectionPage);
const CreateOrganizationsPageLazy = memo(CreateOrganizationPage);
const ContextPageLazy = memo(ContextPage);

function DefaultOrgRedirect({ rest }: { rest?: string }) {
	const { profile, isActive } = useCloud();
	const defaultOrg = profile.default_org;

	if (!defaultOrg || !isActive) {
		return (
			<Center flex={1}>
				<Loader size="lg" />
			</Center>
		);
	}

	return <Redirect to={rest ? `/o/${defaultOrg}/${rest}` : `/o/${defaultOrg}`} />;
}

export function SurrealistScreen() {
	const showCloud = useIsCloudEnabled();
	const { isLoading: isProcessingAuth } = useCloud();
	const title = useInterfaceStore((s) => s.title);

	const [storedSidebarMode] = useSetting("appearance", "sidebarMode");
	const [backgroundGlobulesOpacity] = useSetting("appearance", "backgroundGlobulesOpacity");
	const sidebarMode = storedSidebarMode === "compact" ? "compact" : "wide";
	const isMacos = adapter.platform === "darwin" && isDesktop;
	const isOtherOS = adapter.platform !== "darwin" && isDesktop;

	return (
		<SidebarProvider mode={sidebarMode}>
			<Box
				className={classes.root}
				style={{
					"--bg-image": `url(${globulesImg})`,
					"--bg-opacity": backgroundGlobulesOpacity,
					"--titlebar-offset": `${adapter.titlebarOffset}px`,
				}}
			>
				{isOtherOS && <AppTitleBar />}
				<Flex
					direction="column"
					flex={1}
					pos="relative"
				>
					<DatabaseSidebarLazy visibleFrom="md" />

					<Box
						className={classes.wrapper}
						mod={{ sidebarMode }}
					>
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
							gap={0}
						>
							<Box className={classes.toolbar}>
								<SurrealistToolbar />
							</Box>

							<Box
								flex={1}
								display="flex"
								className={classes.pageContentInner}
							>
								<Switch>
									{/* Overview page */}
									<Route path="/">
										<GlobalSidebar />
										<OverviewPageLazy />
									</Route>

									{/* Legacy overview URL */}
									<Route path="/overview">
										<Redirect to="/" />
									</Route>

									{/* Legacy sign-in URL: onboarding is a global modal */}
									<Route path="/signin">
										<Redirect to="/" />
									</Route>

									{/* New embed page */}
									<Route path="/mini/new">
										<GlobalSidebar />
										<NewEmbedPageLazy />
									</Route>

									{/* Create connection page */}
									<Route path="/c/create">
										<GlobalSidebar />
										<CreateConnectionPageLazy />
									</Route>

									{/* Support page */}
									<Route path="/support">
										<GlobalSidebar />
										<SupportPageLazy />
									</Route>

									{/* Support collections page */}
									<Route path="/support/collections/:collection">
										{({ collection }) => (
											<>
												<GlobalSidebar />
												<CollectionPage id={collection} />
											</>
										)}
									</Route>

									{/* Support articles page */}
									<Route path="/support/articles/:article">
										{({ article }) => (
											<>
												<GlobalSidebar />
												<ArticlePage id={article} />
											</>
										)}
									</Route>

									{/* Support requests page */}
									<Route path="/support/requests">
										<GlobalSidebar />
										<RequestsPageLazy />
									</Route>

									{/* Support conversations page */}
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
											{/* Create organization page */}
											<Route path="/o/create">
												<GlobalSidebar />
												<CreateOrganizationsPageLazy />
											</Route>

											{/* Default organization redirect */}
											<Route path="/o/default/*">
												{(params: { "*": string }) => (
													<>
														<GlobalSidebar />
														<CloudGuard>
															<DefaultOrgRedirect
																rest={params["*"]}
															/>
														</CloudGuard>
													</>
												)}
											</Route>

											{/* Organization deploy page */}
											<Route path="/o/:organization/instances/deploy">
												{({ organization }) => (
													<>
														<OrganisationSidebar
															organizationId={organization}
														/>
														<OrganizationDeployPageLazy
															id={organization}
														/>
													</>
												)}
											</Route>

											{/* Organization contexts deploy page */}
											<Route path="/o/:organization/contexts/deploy">
												{({ organization }) => (
													<>
														<OrganisationSidebar
															organizationId={organization}
														/>
														<OrganizationContextDeployPageLazy
															id={organization}
														/>
													</>
												)}
											</Route>

											{/* Organization context plan selection page */}
											<Route path="/o/:organization/contexts/plan">
												{({ organization }) => (
													<>
														<OrganisationSidebar
															organizationId={organization}
														/>
														<OrganizationContextPlanPageLazy
															id={organization}
														/>
													</>
												)}
											</Route>

											{/* Organization context checkout page */}
											<Route path="/o/:organization/contexts/checkout">
												{({ organization }) => (
													<>
														<OrganisationSidebar
															organizationId={organization}
														/>
														<OrganizationContextCheckoutPageLazy
															id={organization}
														/>
													</>
												)}
											</Route>

											{/* Organization support plans page */}
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

											{/* Organization view page */}
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

											{/* Organization overview redirect */}
											<Route path="/o/:organization">
												{({ organization }) => (
													<Redirect to={`/o/${organization}/overview`} />
												)}
											</Route>

											{/* Referrals page */}
											<Route path="/referrals">
												<GlobalSidebar />
												<ReferralPageLazy />
											</Route>
										</>
									)}

									{/* Connection settings */}
									<Route path="/c/:connection/settings/:tab">
										{({ tab }) => (
											<>
												<ConnectionSidebar />
												<ConnectionPageLazy settingsTab={tab} />
											</>
										)}
									</Route>

									<Route path="/c/:connection/settings">
										{({ connection }) => (
											<Redirect to={`/c/${connection}/settings/general`} />
										)}
									</Route>

									{/* Connection view page */}
									<Route path="/c/:connection/:view">
										{({ view }) => (
											<>
												<ConnectionSidebar />
												<ConnectionPageLazy view={view as ViewPage} />
											</>
										)}
									</Route>

									{/* Context view page (Spectron) */}
									<Route path="/s/:organization/:context/:view">
										{({ view }) => <ContextPageLazy view={view} />}
									</Route>

									{/* Fallback redirect to overview page */}
									<Route>
										<Redirect to="/" />
									</Route>
								</Switch>
							</Box>
						</Stack>
					</Box>
				</Flex>

				{/* <Drawer
					withCloseButton={false}
					size={215}
				>
					<DatabaseSidebarLazy fill />
				</Drawer> */}

				<LoadingOverlay
					visible={isProcessingAuth}
					zIndex={1000}
					overlayProps={{ blur: 4 }}
				/>
			</Box>
		</SidebarProvider>
	);
}
