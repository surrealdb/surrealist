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
import { BetaBadge } from "~/components/BetaBadge";
import { NavigationIcon } from "~/components/NavigationIcon";
import { Shortcut } from "~/components/Shortcut";
import { Spacer } from "~/components/Spacer";
import { VIEW_MODES } from "~/constants";
import { useBoolean } from "~/hooks/boolean";
import { useLogoUrl } from "~/hooks/brand";
import { useCloudRoute, useSurrealCloud } from "~/hooks/cloud";
import { useConnection } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useInterfaceStore } from "~/stores/interface";
import type { SidebarMode, ViewMode } from "~/types";
import { useFeatureFlags } from "~/util/feature-flags";
import { isMobile } from "~/util/helpers";
import { iconCloud, iconCog, iconSearch } from "~/util/icons";
import { dispatchIntent } from "~/util/intents";

const NAVIGATION: ViewMode[][] = [
	["query", "explorer", "graphql"],
	["designer", "authentication", "functions", "models"],
	["documentation"],
];

export interface SidebarProps extends BoxProps {
	sidebarMode: SidebarMode;
}

export function DatabaseSidebar({ sidebarMode, className, ...other }: SidebarProps) {
	const [flags] = useFeatureFlags();

	const logoUrl = useLogoUrl();
	const isLight = useIsLight();
	const showCloud = useSurrealCloud();
	const [, navigate] = useLocation();
	const cloudActive = useCloudRoute();
	const availableUpdate = useInterfaceStore((s) => s.availableUpdate);
	const connection = useConnection((c) => c.id);

	const [canHoverSidebar, hoverSidebarHandle] = useBoolean(true);

	const setLocation = useStable((location: string) => {
		hoverSidebarHandle.close();
		navigate(location);
	});

	const navigation = useMemo(() => {
		return NAVIGATION.flatMap((row) => {
			const items = row.flatMap((id) => {
				const info = VIEW_MODES[id];

				return !info || !info.disabled?.(flags) !== true ? [] : [info];
			});

			return items.length > 0 ? [items] : [];
		});
	}, [flags]);

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
				<UnstyledButton onClick={() => setLocation("/start")}>
					<Flex
						wrap="nowrap"
						align="center"
						style={{ flexShrink: 0 }}
					>
						<Image
							src={iconUrl}
							w={42}
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
					{showCloud && (
						<>
							<NavigationIcon
								name={
									<Group
										wrap="nowrap"
										gap="xs"
									>
										Surreal Cloud
										<BetaBadge />
									</Group>
								}
								icon={iconCloud}
								isActive={cloudActive}
								path="cloud"
								withTooltip={sidebarMode === "compact"}
								onClick={() => setLocation("/cloud")}
								onMouseEnter={hoverSidebarHandle.open}
							/>

							<Divider color={isLight ? "slate.2" : "slate.7"} />
						</>
					)}

					{navigation.map((items, i) => (
						<Fragment key={i}>
							{items.map((info) => (
								<Group
									key={info.id}
									gap="lg"
									wrap="nowrap"
								>
									<NavigationIcon
										name={info.name}
										path={info.id}
										icon={info.anim || info.icon}
										onClick={() => setLocation(`/${info.id}`)}
										onMouseEnter={hoverSidebarHandle.open}
										withTooltip={sidebarMode === "compact"}
										disabled={!connection}
										style={{
											opacity: connection ? 1 : 0.5,
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
