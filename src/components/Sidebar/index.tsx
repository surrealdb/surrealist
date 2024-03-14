import classes from "./style.module.scss";
import surrealistLogo from "~/assets/images/logo.png";
import { ScrollArea, Stack, Divider, Image, Flex, Group } from "@mantine/core";
import { Fragment, useMemo } from "react";
import { isBrowser } from "~/adapter";
import { iconDownload, iconCog } from "~/util/icons";
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

const NAVIGATION: ViewMode[][] = [
	[
		"query",
		"explorer",
		"designer",
		"authentication",
	],
	[
		"models",
	],
	[
		"documentation",
	],
];

export interface SidebarProps {
	onToggleDownload: () => void;
	onToggleSettings: () => void;
}

export function Sidebar({
	onToggleDownload,
	onToggleSettings,
}: SidebarProps) {
	const { setActiveView } = useConfigStore.getState();

	const [flags] = useFeatureFlags();
	const isLight = useIsLight();
	const activeView = useConfigStore((s) => s.activeView);

	const setViewMode = useStable((id: ViewMode) => {
		updateTitle();
		setActiveView(id);
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

	return (
		<ScrollArea
			scrollbars="y"
			type="never"
			pos="fixed"
			top={0}
			left={0}
			bottom={0}
			bg={isLight ? "slate.0" : "slate.9"}
			className={classes.root}
		>
			<Flex
				direction="column"
				h="100%"
				px={16}
				pb={16}
			>
				<Group
					mt={26}
					wrap="nowrap"
					gap="lg"
				>
					<Image
						style={{ pointerEvents: "none", userSelect: "none" }}
						src={surrealistLogo}
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
				>
					{navigation.map((items, i) => (
						<Fragment key={i}>
							{items.map(info => (
								<Group gap="lg" wrap="nowrap">
									<NavigationIcon
										name={info.name}
										isLight={isLight}
										isActive={info.id === activeView}
										icon={info.icon}
										onClick={() => setViewMode(info.id)}
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
							isLight={isLight}
							icon={iconDownload}
							onClick={onToggleDownload}
						/>
					)}

					<NavigationIcon
						name="Settings"
						isLight={isLight}
						icon={iconCog}
						onClick={onToggleSettings}
					/>
				</Stack>
			</Flex>
		</ScrollArea>
	);
}