import { Divider, Flex, Group, Image, Stack } from "@mantine/core";
import { Fragment, useMemo } from "react";
import iconUrl from "~/assets/images/icon.webp";
import { NavigationIcon } from "~/components/NavigationIcon";
import { Shortcut } from "~/components/Shortcut";
import { Spacer } from "~/components/Spacer";
import { VIEW_MODES } from "~/constants";
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

export interface SidebarProps {
	sidebarMode: SidebarMode;
	onNavigate: () => void;
	onItemHover: () => void;
}

export function DatabaseSidebar({
	sidebarMode,
	onNavigate,
	onItemHover,
}: SidebarProps) {
	const { setActiveView } = useConfigStore.getState();
	const [flags] = useFeatureFlags();

	const logoUrl = useLogoUrl();
	const isLight = useIsLight();
	const connection = useConnection();
	const activeView = useConfigStore((s) => s.activeView);

	const setViewMode = useStable((id: ViewMode) => {
		setActiveView(id);
		onNavigate();
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
	const openCommands = useStable(() =>
		dispatchIntent("open-command-palette"),
	);

	const { cloud } = VIEW_MODES;

	function renderNavigation(info: ViewInfo) {
		const isAvailable =
			info.require !== "database" || connection?.lastDatabase;

		return (
			<NavigationIcon
				name={info.name}
				isActive={info.id === activeView}
				icon={info.anim || info.icon}
				withTooltip={sidebarMode === "compact"}
				onClick={() => setViewMode(info.id)}
				onMouseEnter={onItemHover}
				style={{
					opacity: isAvailable ? 1 : 0.5,
				}}
			/>
		);
	}

	return (
		<>
			<Flex wrap="nowrap" align="center" style={{ flexShrink: 0 }}>
				<Image src={iconUrl} w={42} />
				<Image
					src={logoUrl}
					style={{ flexShrink: 0 }}
					w={118}
					ml={14}
				/>
			</Flex>
			<Stack gap="sm" mt={22} pb={18} component="nav" flex={1}>
				{connection &&
					navigation.map((items, i) => (
						<Fragment key={i}>
							{items.map((info) => (
								<Group key={info.id} gap="lg" wrap="nowrap">
									{renderNavigation(info)}
								</Group>
							))}
							{i < navigation.length - 1 && (
								<Divider
									color={isLight ? "slate.2" : "slate.7"}
								/>
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
					onMouseEnter={onItemHover}
				/>

				<NavigationIcon
					name="Settings"
					icon={iconCog}
					onClick={openSettings}
					onMouseEnter={onItemHover}
				/>
			</Stack>
		</>
	);
}
