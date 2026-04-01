import {
	type BoxProps,
	Divider,
	Flex,
	Group,
	Image,
	ScrollArea,
	Stack,
	UnstyledButton,
} from "@mantine/core";
import {
	iconArrowLeft,
	iconChat,
	iconCog,
	iconCreditCard,
	iconDollar,
	iconHelp,
	iconOrganization,
	iconProgressClock,
	iconSearch,
	iconServer,
	pictoSurrealist,
} from "@surrealdb/ui";
import clsx from "clsx";
import { Fragment, useMemo } from "react";
import {
	hasOrganizationRoles,
	isBillingManaged,
	ORG_ROLES_ADMIN,
	ORG_ROLES_OWNER,
	ORG_ROLES_SUPPORT,
} from "~/cloud/helpers";
import { useCloudUnreadConversationsQuery } from "~/cloud/queries/context";
import { useCloudInstanceQuery } from "~/cloud/queries/instances";
import { useCloudOrganizationQuery } from "~/cloud/queries/organizations";
import { NavigationIcon } from "~/components/NavigationIcon";
import { Shortcut } from "~/components/Shortcut";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useLogoUrl } from "~/hooks/brand";
import { useAvailablePages, useAvailableViews, useConnection } from "~/hooks/connection";
import {
	useAbsoluteLocation,
	useAbsoluteRoute,
	useConnectionAndView,
	useConnectionNavigator,
} from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import type { GlobalPage, SidebarMode, ViewPage } from "~/types";
import { isMobile } from "~/util/helpers";
import { dispatchIntent } from "~/util/intents";
import classes from "./style.module.scss";

const GLOBAL_NAVIGATION: GlobalPage[][] = [["/overview"], ["/referrals"], ["/mini/new"]];

const VIEW_NAVIGATION: ViewPage[][] = [
	["dashboard", "monitor", "migrations"],
	["query", "explorer", "graphql"],
	["designer", "authentication", "parameters", "functions"],
	["documentation"],
];

interface NavigationItem {
	name: string;
	icon: string;
	match: string[];
	navigate: () => void;
}

export interface SurrealistSidebarProps extends BoxProps {
	sidebarMode: SidebarMode;
}

export function SurrealistSidebar({ sidebarMode, className, ...other }: SurrealistSidebarProps) {
	const logoUrl = useLogoUrl();
	const isLight = useIsLight();
	const [, navigate] = useAbsoluteLocation();
	const [connection] = useConnectionAndView();
	const navigateConnection = useConnectionNavigator();
	const availableUpdate = useInterfaceStore((s) => s.availableUpdate);
	const sidebarViews = useConfigStore((s) => s.settings.appearance.sidebarViews);
	const pages = useAvailablePages();
	const views = useAvailableViews();

	const instanceId = useConnection((s) => s?.authentication.cloudInstance);
	const instanceQuery = useCloudInstanceQuery(instanceId);

	const { data: unreadConversations } = useCloudUnreadConversationsQuery();

	const { setOverlaySidebar } = useInterfaceStore.getState();
	const [canHoverSidebar, hoverSidebarHandle] = useBoolean(true);

	const setLocation = useStable((location: string) => {
		hoverSidebarHandle.close();
		navigate(location);
	});

	const globalNavigation: NavigationItem[][] = useMemo(() => {
		return GLOBAL_NAVIGATION.flatMap((row) => {
			const items = row.flatMap((id) => {
				const info = pages[id];

				if (!info) {
					return [];
				}

				return {
					id: info.id,
					name: info.name,
					icon: info.icon,
					match: [info.id, ...(info.aliases || [])],
					navigate: () => setLocation(info.id),
				};
			});

			return items.length > 0 ? [items] : [];
		});
	}, [pages]);

	const viewNavigation: NavigationItem[][] = useMemo(() => {
		if (!connection) {
			return [];
		}

		return VIEW_NAVIGATION.flatMap((row) => {
			const items = row.flatMap((id) => {
				const info = views[id];

				if (!info || sidebarViews[id] === false) {
					return [];
				}

				return {
					id: info.id,
					name: info.name,
					icon: info.icon,
					match: [`/c/*/${info.id}`],
					disabled: !connection,
					navigate: () => {
						hoverSidebarHandle.close();
						navigateConnection(connection, info.id);
					},
				};
			});

			return items.length > 0 ? [items] : [];
		});
	}, [views, sidebarViews, connection]);

	const [isOrgRoute, orgParams] = useAbsoluteRoute("/o/:organization/:rest*");
	const organizationId = isOrgRoute ? orgParams?.organization : undefined;
	const { data: orgData } = useCloudOrganizationQuery(organizationId);

	const isOrgSupport = orgData ? hasOrganizationRoles(orgData, ORG_ROLES_SUPPORT) : false;
	const isOrgAdmin = orgData ? hasOrganizationRoles(orgData, ORG_ROLES_ADMIN) : false;
	const isOrgOwner = orgData ? hasOrganizationRoles(orgData, ORG_ROLES_OWNER, true) : false;
	const isOrgManagedBilling = orgData ? isBillingManaged(orgData) : false;

	const orgNavigation: NavigationItem[][] = useMemo(() => {
		if (!organizationId) {
			return [];
		}

		const base = `/o/${organizationId}`;

		const primary: NavigationItem[] = [
			{
				name: "Overview",
				icon: iconServer,
				match: [`${base}/overview`],
				navigate: () => setLocation(`${base}/overview`),
			},
			{
				name: "Team",
				icon: iconOrganization,
				match: [`${base}/team`],
				navigate: () => setLocation(`${base}/team`),
			},
		];

		const billing: NavigationItem[] = [
			...(isOrgOwner && !isOrgManagedBilling
				? [
						{
							name: "Invoices",
							icon: iconDollar,
							match: [`${base}/invoices`],
							navigate: () => setLocation(`${base}/invoices`),
						},
					]
				: []),
			...(isOrgOwner
				? [
						{
							name: "Billing",
							icon: iconCreditCard,
							match: [`${base}/billing`],
							navigate: () => setLocation(`${base}/billing`),
						},
					]
				: []),
			...(isOrgSupport
				? [
						{
							name: "Support",
							icon: iconChat,
							match: [`${base}/support`],
							navigate: () => setLocation(`${base}/support`),
						},
					]
				: []),
		];

		const admin: NavigationItem[] = isOrgAdmin
			? [
					{
						name: "Usage",
						icon: iconProgressClock,
						match: [`${base}/usage`],
						navigate: () => setLocation(`${base}/usage`),
					},
					{
						name: "Settings",
						icon: iconCog,
						match: [`${base}/settings`],
						navigate: () => setLocation(`${base}/settings`),
					},
				]
			: [];

		return [primary, billing, admin].filter((group) => group.length > 0);
	}, [organizationId, isOrgOwner, isOrgManagedBilling, isOrgSupport, isOrgAdmin]);

	const navigation = connection ? viewNavigation : isOrgRoute ? orgNavigation : globalNavigation;

	const openSettings = useStable(() => dispatchIntent("open-settings"));
	const openCommands = useStable(() => dispatchIntent("open-command-palette"));

	const isHoverable = sidebarMode === "expandable" && canHoverSidebar;
	const isCollapsed = sidebarMode === "compact" || sidebarMode === "expandable";
	const isFilled = sidebarMode === "fill";

	return (
		<ScrollArea
			scrollbars="y"
			type="never"
			pos="fixed"
			component="aside"
			top={0}
			left={0}
			bottom={0}
			bg="var(--mantine-color-body)"
			onMouseEnter={hoverSidebarHandle.open}
			className={clsx(
				classes.sidebar,
				isHoverable && classes.sidebarHoverable,
				isCollapsed && classes.sidebarCollapsed,
				isFilled && classes.sidebarFill,
				className,
			)}
			{...other}
		>
			<Flex
				className={classes.sidebarInner}
				direction="column"
				px={16}
			>
				<UnstyledButton
					onClick={() => {
						setLocation("/overview");
						setOverlaySidebar(false);
					}}
				>
					<Group
						gap="lg"
						wrap="nowrap"
						align="center"
						style={{ flexShrink: 0 }}
					>
						<Image
							my={-9}
							src={pictoSurrealist}
							w={42}
							className={classes.hat}
						/>
						<Image
							src={logoUrl}
							style={{ flexShrink: 0 }}
							w={118}
						/>
					</Group>
				</UnstyledButton>
				<Stack
					gap="sm"
					mt={22}
					pb={18}
					component="nav"
					flex={1}
				>
					{connection && instanceId ? (
						<>
							<NavigationIcon
								name="Organization"
								icon={iconArrowLeft}
								onClick={() =>
									setLocation(`/o/${instanceQuery.data?.organization_id}`)
								}
								onMouseEnter={hoverSidebarHandle.open}
								withTooltip={sidebarMode === "compact"}
							/>
							<Divider color={isLight ? "obsidian.2" : "obsidian.7"} />
						</>
					) : connection || isOrgRoute ? (
						<>
							<NavigationIcon
								name="Overview"
								icon={iconArrowLeft}
								onClick={() => setLocation("/overview")}
								onMouseEnter={hoverSidebarHandle.open}
								withTooltip={sidebarMode === "compact"}
							/>
							<Divider color={isLight ? "obsidian.2" : "obsidian.7"} />
						</>
					) : null}

					{navigation.map((items, i) => (
						<Fragment key={i}>
							{items.map((info) => (
								<Group
									key={info.name}
									gap="lg"
									wrap="nowrap"
								>
									<NavigationIcon
										name={info.name}
										icon={info.icon}
										match={info.match}
										onClick={info.navigate}
										onMouseEnter={hoverSidebarHandle.open}
										withTooltip={sidebarMode === "compact"}
									/>
								</Group>
							))}
							{i < navigation.length - 1 && (
								<Divider color={isLight ? "obsidian.2" : "obsidian.7"} />
							)}
						</Fragment>
					))}

					<Spacer />

					<NavigationIcon
						name={
							<Group wrap="nowrap">
								Search
								{!isMobile() && <Shortcut value={["mod", "K"]} />}
							</Group>
						}
						icon={iconSearch}
						onClick={openCommands}
						onMouseEnter={hoverSidebarHandle.open}
						withTooltip={sidebarMode === "compact"}
					/>

					<NavigationIcon
						name="Support"
						icon={iconHelp}
						match={["/support", "/support/*"]}
						onClick={() => navigate("/support")}
						onMouseEnter={hoverSidebarHandle.open}
						withTooltip={sidebarMode === "compact"}
						indicator={unreadConversations}
					/>

					<NavigationIcon
						name="Settings"
						icon={iconCog}
						onClick={openSettings}
						onMouseEnter={hoverSidebarHandle.open}
						withTooltip={sidebarMode === "compact"}
						indicator={!!availableUpdate}
					/>
				</Stack>
			</Flex>
		</ScrollArea>
	);
}
