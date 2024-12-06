import classes from "./style.module.scss";

import { Alert, Box, Button, Flex, Group, Image, Stack, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { type FC, Suspense, lazy, useLayoutEffect } from "react";
import { HtmlPortalNode, InPortal, OutPortal, createHtmlPortalNode } from "react-reverse-portal";
import { Redirect, Route, Switch, useLocation, useRoute } from "wouter";
import { adapter } from "~/adapter";
import splashUrl from "~/assets/images/cloud-splash.webp";
import logoDarkUrl from "~/assets/images/dark/cloud-logo.svg";
import logoLightUrl from "~/assets/images/light/cloud-logo.svg";
import { Icon } from "~/components/Icon";
import { CLOUD_PAGES } from "~/constants";
import { useSurrealCloud } from "~/hooks/cloud";
import { useIsLight, useThemeImage } from "~/hooks/theme";
import { useCloudStore } from "~/stores/cloud";
import type { CloudAlert, CloudPage } from "~/types";
import { useFeatureFlags } from "~/util/feature-flags";
import { iconChevronRight, iconErrorCircle, iconOpen } from "~/util/icons";
import { fetchAPI } from "./api";
import { openCloudAuthentication } from "./api/auth";
import { StatusAlert } from "./components/StatusAlert";
import BillingPage from "./pages/Billing";
import ChatPage from "./pages/Chat";
import InstancesPage from "./pages/Instances";
import MembersPage from "./pages/Members";
import PlaceholderPage from "./pages/Placeholder";
import ProvisionPage from "./pages/Provision";
import SettingsPage from "./pages/Settings";
import SupportPage from "./pages/Support";
import { CloudSidebar } from "./sidebar";
import { CloudToolbar } from "./toolbar";

const PORTAL_OPTIONS = {
	attributes: {
		style: "height: 100%; display: flex; flex-direction: column;",
	},
};

const PAGE_PORTALS: Record<CloudPage, HtmlPortalNode> = {
	instances: createHtmlPortalNode(PORTAL_OPTIONS),
	members: createHtmlPortalNode(PORTAL_OPTIONS),
	audits: createHtmlPortalNode(PORTAL_OPTIONS),
	data: createHtmlPortalNode(PORTAL_OPTIONS),
	billing: createHtmlPortalNode(PORTAL_OPTIONS),
	support: createHtmlPortalNode(PORTAL_OPTIONS),
	settings: createHtmlPortalNode(PORTAL_OPTIONS),
	provision: createHtmlPortalNode(PORTAL_OPTIONS),
	chat: createHtmlPortalNode(PORTAL_OPTIONS),
};

const PAGE_COMPONENTS: Record<CloudPage, FC> = {
	instances: InstancesPage,
	members: MembersPage,
	audits: PlaceholderPage,
	data: PlaceholderPage,
	billing: BillingPage,
	support: SupportPage,
	settings: SettingsPage,
	provision: ProvisionPage,
	chat: ChatPage,
};

export function CloudView() {
	const [{ cloud_access }] = useFeatureFlags();
	const isLight = useIsLight();

	const state = useCloudStore((s) => s.authState);
	const isSupported = useCloudStore((s) => s.isSupported);

	const isCloud = useSurrealCloud();
	const [isCloudHome] = useRoute("/cloud");
	const [, navigate] = useLocation();

	const alertQuery = useQuery({
		queryKey: ["cloud", "message"],
		refetchInterval: 15_000,
		retry: false,
		enabled: state === "authenticated",
		queryFn: () => fetchAPI<CloudAlert>(`/message`),
	});

	const logoUrl = useThemeImage({
		light: logoLightUrl,
		dark: logoDarkUrl,
	});

	const hasAlert = alertQuery.data && Object.keys(alertQuery.data).length > 0;

	useLayoutEffect(() => {
		if (!isCloud) return;

		if (isCloudHome && (state === "authenticated" || state === "loading")) {
			navigate("/cloud/instances");
		} else if (!isCloudHome && state === "unauthenticated") {
			navigate("/cloud");
		}
	}, [isCloud, isCloudHome, state]);

	return (
		<>
			<Group
				gap="md"
				pos="relative"
				align="center"
				wrap="nowrap"
			>
				<CloudToolbar showBreadcrumb={!isCloudHome} />
			</Group>

			{isCloudHome ? (
				<>
					<Stack
						gap={38}
						flex={1}
						align="center"
						justify="center"
						style={{ zIndex: 1 }}
						pb={175}
					>
						<Image
							src={logoUrl}
							alt="Surreal Cloud"
							maw={500}
						/>
						<Text
							maw={500}
							fz="lg"
							ta="center"
						>
							Surreal Cloud redefines the database experience, offering the power and
							flexibility of SurrealDB without the pain of managing infrastructure.
							Elevate your business to unparalleled levels of scale and resilience.
							Focus on building tomorrow's applications. Let us take care of the rest.
						</Text>
						{!cloud_access ? (
							<Button
								w={264}
								color="slate"
								variant="gradient"
								rightSection={<Icon path={iconChevronRight} />}
								onClick={() => adapter.openUrl("https://surrealdb.com/signup")}
								style={{
									border: "1px solid rgba(255, 255, 255, 0.3)",
									backgroundOrigin: "border-box",
								}}
							>
								Join the waitlist
							</Button>
						) : isSupported ? (
							<Group>
								<Button
									w={164}
									color="slate"
									variant="gradient"
									rightSection={<Icon path={iconChevronRight} />}
									onClick={openCloudAuthentication}
								>
									Continue
								</Button>
								<Button
									w={164}
									color="slate"
									variant="light"
									rightSection={<Icon path={iconOpen} />}
									onClick={() => adapter.openUrl("https://surrealdb.com/cloud")}
								>
									Learn more
								</Button>
							</Group>
						) : (
							<Alert
								icon={<Icon path={iconErrorCircle} />}
								color={isLight ? "red.6" : "red.5"}
								title="Client update required"
								maw={500}
							>
								Please update your version of Surrealist to continue using Surreal
								Cloud.
							</Alert>
						)}
					</Stack>
					<Box className={classes.splashImageContainer}>
						<Image
							src={splashUrl}
							alt="Surreal Cloud"
							h="100%"
							className={classes.splashImage}
						/>
					</Box>
				</>
			) : (
				<Flex
					flex={1}
					className={classes.cloudContent}
					align="stretch"
					gap="xl"
				>
					<CloudSidebar />
					<Stack flex={1}>
						{hasAlert && <StatusAlert alert={alertQuery.data} />}

						<Switch>
							{Object.values(CLOUD_PAGES).map((page) => (
								<Route
									key={page.id}
									path={`/cloud/${page.id}`}
								>
									<Suspense fallback={null}>
										<OutPortal node={PAGE_PORTALS[page.id]} />
									</Suspense>
								</Route>
							))}

							{isCloud && (
								<Route>
									<Redirect to="/cloud/instances" />
								</Route>
							)}
						</Switch>
					</Stack>

					{Object.values(CLOUD_PAGES).map((page) => {
						const Content = PAGE_COMPONENTS[page.id];

						return (
							<InPortal
								key={page.id}
								node={PAGE_PORTALS[page.id]}
							>
								<Suspense fallback={null}>
									<Content />
								</Suspense>
							</InPortal>
						);
					})}
				</Flex>
			)}
		</>
	);
}

export default CloudView;
