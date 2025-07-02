import classes from "./style.module.scss";

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

import clsx from "clsx";
import { Fragment, useMemo } from "react";
import iconUrl from "~/assets/images/icon.webp";
import { NavigationIcon } from "~/components/NavigationIcon";
import { Shortcut } from "~/components/Shortcut";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useLogoUrl } from "~/hooks/brand";
import { useAvailablePages, useAvailableViews } from "~/hooks/connection";
import { useAbsoluteLocation, useConnectionAndView, useConnectionNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import type { GlobalPage, SidebarMode, ViewPage } from "~/types";
import { isMobile } from "~/util/helpers";
import { iconArrowLeft, iconCog, iconSearch } from "~/util/icons";
import { dispatchIntent } from "~/util/intents";

const GLOBAL_NAVIGATION: GlobalPage[][] = [
	["/overview", "/organisations"],
	["/referrals", "/mini/new"],
	["/tickets", "/chat", "/support"],
];

const VIEW_NAVIGATION: ViewPage[][] = [
	["dashboard", "monitor"],
	["query", "explorer", "graphql"],
	["designer", "authentication", "parameters", "functions"],
	["sidekick", "documentation"],
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

	const navigation = connection ? viewNavigation : globalNavigation;

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
			bg={isLight ? "slate.0" : "slate.9"}
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
					<Flex
						wrap="nowrap"
						align="center"
						style={{ flexShrink: 0 }}
					>
						<Image
							src={iconUrl}
							w={42}
							className={classes.hat}
						/>
						<Image
							src={logoUrl}
							style={{ flexShrink: 0 }}
							w={118}
							ml={14}
						/>
					</Flex>
				</UnstyledButton>
				<Stack
					gap="sm"
					mt={22}
					pb={18}
					component="nav"
					flex={1}
				>
					{connection && (
						<>
							<NavigationIcon
								name="Overview"
								icon={iconArrowLeft}
								onClick={() => setLocation("/overview")}
								onMouseEnter={hoverSidebarHandle.open}
								withTooltip={sidebarMode === "compact"}
							/>
							<Divider color={isLight ? "slate.2" : "slate.7"} />
						</>
					)}

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
								<Divider color={isLight ? "slate.2" : "slate.7"} />
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
