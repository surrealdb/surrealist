import classes from "./style.module.scss";
import clsx from "clsx";
import surrealistLogo from "~/assets/images/logo.png";
import { ScrollArea, Stack, Divider, Image, Flex, Group } from "@mantine/core";
import { Fragment, useLayoutEffect, useMemo } from "react";
import { isBrowser } from "~/adapter";
import { iconDownload, iconCog, iconSearch } from "~/util/icons";
import { NavigationIcon } from "../NavigationIcon";
import { Spacer } from "../Spacer";
import { VIEW_MODES } from "~/constants";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";
import { ViewMode } from "~/types";
import { useFeatureFlags } from "~/util/feature-flags";
import { updateTitle } from "~/util/helpers";
import { useIsLight } from "~/hooks/theme";
import { SurrealistLogo } from "../SurrealistLogo";
import { useConnection } from "~/hooks/connection";
import { useSetting } from "~/hooks/config";
import { useHover } from "@mantine/hooks";
import { useBoolean } from "~/hooks/boolean";
import { Shortcut } from "../Shortcut";

const NAVIGATION: ViewMode[][] = [
	[
		"query",
		"explorer",
		"designer",
		"authentication",
	],
	[
		"functions",
		"models",
	],
	[
		"documentation",
	],
];

export interface SidebarProps {
	onToggleDownload: () => void;
	onTogglePalette: () => void;
	onToggleSettings: () => void;
}

export function Sidebar({
	onToggleDownload,
	onTogglePalette,
	onToggleSettings,
}: SidebarProps) {
	const { setActiveView, setActiveConnection } = useConfigStore.getState();

	const [flags] = useFeatureFlags();
	const [expandable] = useSetting("appearance", "expandSidebar");
	const [expanded, expandedHandle] = useBoolean();

	const isLight = useIsLight();
	const connection = useConnection();
	const activeView = useConfigStore((s) => s.activeView);
	const { ref, hovered } = useHover();

	useLayoutEffect(() => {
		expandedHandle.set(hovered);
	}, [hovered]);

	const setViewMode = useStable((id: ViewMode) => {
		updateTitle();
		setActiveView(id);
		expandedHandle.close();
	});

	const navigation = useMemo(() => {
		return NAVIGATION.flatMap((row) => {
			const items = row.flatMap((id) => {
				const info = VIEW_MODES[id];

				if (!info || !info.disabled?.(flags) !== true) {
					return [];
				}

				return [info];
			});

			return items.length > 0 ? [items] : [];
		});
	}, [flags]);

	const shouldExpand = connection && expandable && expanded;

	return (
		<ScrollArea
			scrollbars="y"
			type="never"
			pos="absolute"
			component="aside"
			top={0}
			left={0}
			bottom={0}
			bg={isLight ? "slate.0" : "slate.9"}
			viewportRef={ref}
			className={clsx(classes.root, shouldExpand && classes.expanded)}
		>
			<Flex
				direction="column"
				h="100%"
				px={16}
				pb={18}
				pt={22}
			>
				<Group wrap="nowrap" gap="lg">
					<Image
						src={surrealistLogo}
						onClick={() => setActiveConnection(null)}
						w={42}
					/>
					<SurrealistLogo
						h={21}
						style={{ flexShrink: 0 }}
					/>
				</Group>
				<Stack
					gap="sm"
					h="100%"
					mt={30}
					component="nav"
				>
					{connection && navigation.map((items, i) => (
						<Fragment key={i}>
							{items.map(info => (
								<Group
									key={info.id}
									gap="lg"
									wrap="nowrap"
								>
									<NavigationIcon
										name={info.name}
										isActive={info.id === activeView}
										icon={info.anim || info.icon}
										withTooltip={!expandable}
										onClick={() => setViewMode(info.id)}
										onMouseEnter={expandedHandle.open}
									/>
								</Group>
							))}
							{i < navigation.length - 1 && (
								<Divider color={isLight ? "white" : "slate.7"} />
							)}
						</Fragment>
					))}

					<Spacer />

					{isBrowser && (
						<NavigationIcon
							name="Download App"
							icon={iconDownload}
							onClick={onToggleDownload}
						/>
					)}

					<NavigationIcon
						name={
							<Group wrap="nowrap">
								Search
								<Shortcut value="mod K" />
							</Group>
						}
						icon={iconSearch}
						onClick={onTogglePalette}
					/>

					<NavigationIcon
						name="Settings"
						icon={iconCog}
						onClick={onToggleSettings}
					/>
				</Stack>
			</Flex>
		</ScrollArea>
	);
}