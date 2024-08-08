import logoUrl from "~/assets/images/logo.webp";
import surrealistUrl from "~/assets/images/surrealist.webp";
import { Stack, Divider, Image, Group, Flex } from "@mantine/core";
import { Fragment, useMemo } from "react";
import { iconCog, iconSearch } from "~/util/icons";
import { VIEW_MODES } from "~/constants";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";
import { SidebarMode, ViewInfo, ViewMode } from "~/types";
import { useFeatureFlags } from "~/util/feature-flags";
import { useIsLight } from "~/hooks/theme";
import { useConnection } from "~/hooks/connection";
import { NavigationIcon } from "~/components/NavigationIcon";
import { Shortcut } from "~/components/Shortcut";
import { Spacer } from "~/components/Spacer";
import { dispatchIntent } from "~/hooks/url";

const NAVIGATION: ViewMode[][] = [
	[
		"query",
		"explorer",
		"graphql",
	],
	[
		"designer",
		"authentication",
		"functions",
		"models",
	],
	[
		"documentation",
	],
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

				return (!info || !info.disabled?.(flags) !== true) ? [] : [info];
			});

			return items.length > 0 ? [items] : [];
		});
	}, [flags]);


	const openSettings = useStable(() => dispatchIntent("open-settings"));
	const openCommands = useStable(() => dispatchIntent("open-command-palette"));

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
				onMouseEnter={onItemHover}
				style={{
					opacity: isAvailable ? 1 : 0.5
				}}
			/>
		);
	}

	return (
		<>
			<Flex
				wrap="nowrap"
				align="center"
				style={{ flexShrink: 0 }}
			>
				<Image
					src={logoUrl}
					w={42}
				/>
				<Image
					src={surrealistUrl}
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
				{connection && navigation.map((items, i) => (
					<Fragment key={i}>
						{items.map(info => (
							<Group
								key={info.id}
								gap="lg"
								wrap="nowrap"
							>
								{renderNavigation(info)}
							</Group>
						))}
						{i < navigation.length - 1 && (
							<Divider color={isLight ? "white" : "slate.7"} />
						)}
					</Fragment>
				))}

				<Spacer />

				{renderNavigation(cloud)}

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