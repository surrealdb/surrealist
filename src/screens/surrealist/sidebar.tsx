import classes from "./style.module.scss";

import {
	type BoxProps,
	Divider,
	Flex,
	Group,
	Image,
	ScrollArea,
	Space,
	Stack,
	UnstyledButton,
} from "@mantine/core";

import clsx from "clsx";
import { Fragment, useMemo } from "react";
import { useLocation } from "wouter";
import iconUrl from "~/assets/images/icon.webp";
import { NavigationIcon } from "~/components/NavigationIcon";
import { Shortcut } from "~/components/Shortcut";
import { Spacer } from "~/components/Spacer";
import { GLOBAL_PAGES, VIEW_PAGES } from "~/constants";
import { useBoolean } from "~/hooks/boolean";
import { useLogoUrl } from "~/hooks/brand";
import { useAbsoluteLocation, useActiveConnection, useActiveView } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import type { GlobalPage, SidebarMode, ViewPage } from "~/types";
import { useFeatureFlags } from "~/util/feature-flags";
import { isMobile } from "~/util/helpers";
import { iconCog, iconSearch } from "~/util/icons";
import { dispatchIntent } from "~/util/intents";

const GLOBAL_NAVIGATION: GlobalPage[][] = [
	["overview"],
	["share", "university", "chat"],
	["billing", "referral", "support"],
];

const VIEW_NAVIGATION: ViewPage[][] = [
	["query", "explorer", "graphql"],
	["designer", "authentication", "functions", "models"],
	["sidekick", "documentation"],
];

interface NavigationItem {
	name: string;
	icon: string;
	match: string;
	disabled: boolean;
	navigate: () => void;
}

export interface SurrealistSidebarProps extends BoxProps {
	sidebarMode: SidebarMode;
}

export function SurrealistSidebar({ sidebarMode, className, ...other }: SurrealistSidebarProps) {
	const [flags] = useFeatureFlags();

	const logoUrl = useLogoUrl();
	const isLight = useIsLight();
	const [, navigate] = useAbsoluteLocation();
	const [, setActiveView] = useActiveView();
	const [connection] = useActiveConnection();
	const availableUpdate = useInterfaceStore((s) => s.availableUpdate);
	const enabledViews = useConfigStore((s) => s.settings.appearance.sidebarViews);

	const { setOverlaySidebar } = useInterfaceStore.getState();
	const [canHoverSidebar, hoverSidebarHandle] = useBoolean(true);

	const setLocation = useStable((location: string) => {
		hoverSidebarHandle.close();
		navigate(location);
	});

	const globalNavigation: NavigationItem[][] = useMemo(() => {
		return GLOBAL_NAVIGATION.flatMap((row) => {
			const items = row.flatMap((id) => {
				const info = GLOBAL_PAGES[id];

				return {
					id: info.id,
					name: info.name,
					icon: info.icon,
					match: `/${info.id}`,
					disabled: false,
					navigate: () => setLocation(info.id),
				};
			});

			return items.length > 0 ? [items] : [];
		});
	}, []);

	const viewNavigation: NavigationItem[][] = useMemo(() => {
		return VIEW_NAVIGATION.flatMap((row) => {
			const items = row.flatMap((id) => {
				const info = VIEW_PAGES[id];

				if (!info || !info.disabled?.(flags) !== true || enabledViews[id] === false) {
					return [];
				}

				return {
					id: info.id,
					name: info.name,
					icon: info.icon,
					match: `/c/*/${info.id}`,
					disabled: !connection,
					navigate: () => {
						hoverSidebarHandle.close();
						setActiveView(info.id);
					},
				};
			});

			return items.length > 0 ? [items] : [];
		});
	}, [flags, enabledViews, connection]);

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
				direction="column"
				h="100%"
				px={16}
				pt={22}
			>
				<Space h="var(--titlebar-offset)" />
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
					{/* {connection && (
						<>
							<NavigationIcon
								name="Back to overview"
								icon={iconChevronLeft}
								onClick={() => setLocation("/overview")}
								onMouseEnter={hoverSidebarHandle.open}
								withTooltip={sidebarMode === "compact"}
							/>
							<Divider />
						</>
					)} */}

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
										path={info.match}
										icon={info.icon}
										onClick={info.navigate}
										onMouseEnter={hoverSidebarHandle.open}
										withTooltip={sidebarMode === "compact"}
										disabled={info.disabled}
										style={{
											opacity: info.disabled ? 0.5 : 1,
										}}
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
