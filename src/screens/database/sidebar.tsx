import classes from "./style.module.scss";

import { type BoxProps, Divider, Flex, Group, Image, ScrollArea, Stack } from "@mantine/core";
import clsx from "clsx";
import { Fragment, useMemo } from "react";
import iconUrl from "~/assets/images/icon.webp";
import { NavigationIcon } from "~/components/NavigationIcon";
import { Shortcut } from "~/components/Shortcut";
import { Spacer } from "~/components/Spacer";
import { VIEW_MODES } from "~/constants";
import { useBoolean } from "~/hooks/boolean";
import { useLogoUrl } from "~/hooks/brand";
import { useConnection } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { dispatchIntent } from "~/hooks/url";
import { useConfigStore } from "~/stores/config";
import type { SidebarMode, ViewInfo, ViewMode } from "~/types";
import { useFeatureFlags } from "~/util/feature-flags";
import { iconCog, iconSearch } from "~/util/icons";

const NAVIGATION: ViewMode[][] = [
	["query", "explorer", "graphql"],
	["designer", "authentication", "functions", "models"],
	["documentation"],
];

export interface SidebarProps extends BoxProps {
	sidebarMode: SidebarMode;
	withTitlebarOffset?: boolean;
}

export function DatabaseSidebar({
	sidebarMode,
	withTitlebarOffset,
	className,
	...other
}: SidebarProps) {
	const { setActiveView } = useConfigStore.getState();
	const [flags] = useFeatureFlags();

	const logoUrl = useLogoUrl();
	const isLight = useIsLight();
	const connection = useConnection();
	const activeView = useConfigStore((s) => s.activeView);

	const [canHoverSidebar, hoverSidebarHandle] = useBoolean(true);

	const setViewMode = useStable((id: ViewMode) => {
		setActiveView(id);
		hoverSidebarHandle.close();
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

	const { cloud } = VIEW_MODES;

	function renderNavigation(info: ViewInfo) {
		const isAvailable = info.require !== "database" || connection?.lastDatabase;

		return (
			<NavigationIcon
				name={info.name}
				isActive={info.id === activeView}
				icon={info.anim || info.icon}
				withTooltip={sidebarMode === "compact"}
				onClick={() => setViewMode(info.id)}
				onMouseEnter={hoverSidebarHandle.open}
				style={{
					opacity: isAvailable ? 1 : 0.5,
				}}
			/>
		);
	}

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
				pt={withTitlebarOffset ? 38 : 22}
				direction="column"
				h="100%"
				px={16}
			>
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
				<Stack
					gap="sm"
					mt={22}
					pb={18}
					component="nav"
					flex={1}
				>
					{connection &&
						navigation.map((items, i) => (
							<Fragment key={i}>
								{items.map((info) => (
									<Group
										key={info.id}
										gap="lg"
										wrap="nowrap"
									>
										{renderNavigation(info)}
									</Group>
								))}
								{i < navigation.length - 1 && (
									<Divider color={isLight ? "slate.2" : "slate.7"} />
								)}
							</Fragment>
						))}

					<Spacer />

					{!cloud.disabled?.(flags) && renderNavigation(cloud)}

					<NavigationIcon
						name={
							<Group wrap="nowrap">
								Search
								<Shortcut value="mod K" />
							</Group>
						}
						icon={iconSearch}
						onClick={openCommands}
						onMouseEnter={hoverSidebarHandle.open}
					/>

					<NavigationIcon
						name="Settings"
						icon={iconCog}
						onClick={openSettings}
						onMouseEnter={hoverSidebarHandle.open}
					/>
				</Stack>
			</Flex>
		</ScrollArea>
	);
}
