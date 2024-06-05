import { useIsLight } from "~/hooks/theme";
import classes from "./style.module.scss";
import { PropsWithChildren, ReactNode, useLayoutEffect, useMemo } from "react";
import { useConfigStore } from "~/stores/config";
import { useSetting } from "~/hooks/config";
import { themeColor } from "~/util/mantine";
import { adapter, isDesktop } from "~/adapter";
import { Box, Button, Center, Flex, Group, ScrollArea, Stack, Text } from "@mantine/core";
import { useInterfaceStore } from "~/stores/interface";
import { isMobile } from "~/util/helpers";
import { iconOpen } from "~/util/icons";
import { Icon } from "../Icon";
import { SurrealistLogo } from "../SurrealistLogo";
import { useHover } from "@mantine/hooks";
import { BooleanHandle, useBoolean } from "~/hooks/boolean";
import clsx from "clsx";
import { SidebarMode } from "~/types";

export interface ScreenState {
	sidebarMode: SidebarMode,
	sidebarOpen: boolean,
	sidebarHandle: BooleanHandle,
}

export interface ScreenProps {
	toolbar?: (state: ScreenState) => ReactNode;
	sidebar?: (state: ScreenState) => ReactNode;
}

export function Screen({
	toolbar,
	sidebar,
	children
}: PropsWithChildren<ScreenProps>) {
	const isLight = useIsLight();

	const activeConnection = useConfigStore((s) => s.activeConnection);
	const title = useInterfaceStore((s) => s.title);

	const [mode] = useSetting("appearance", "sidebarMode");
	const [expanded, expandedHandle] = useBoolean();
	const { ref, hovered } = useHover();

	const state = useMemo(() => ({
		sidebarMode: mode,
		sidebarOpen: expanded,
		sidebarHandle: expandedHandle
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}), [mode, expanded]);

	useLayoutEffect(() => {
		expandedHandle.set(hovered);
	}, [expandedHandle, hovered]);

	const shouldExpand = mode === "expandable" && expanded;
	const nudgeSidebar = adapter.platform === "darwin" && isDesktop;

	return (
		<div
			className={classes.root}
			style={{
				backgroundColor: isLight
					? (activeConnection ? themeColor("slate.0") : "white")
					: (activeConnection ? themeColor("slate.9") : "black")
			}}
		>
			{!adapter.hasTitlebar && (
				<Center
					data-tauri-drag-region
					className={classes.titlebar}
				>
					{title}
				</Center>
			)}

			{isMobile() && (
				<Center
					pos="fixed"
					inset={0}
					bg="slate.9"
					style={{ zIndex: 1000 }}
				>
					<Stack maw={250} mx="auto">
						<SurrealistLogo />

						<Text c="bright" mt="lg">
							Surrealist is the ultimate way to visually manage your SurrealDB database
						</Text>

						<Text c="slate.3">
							Support for Surrealist on mobile platforms is currently unavailable, however you can visit Surrealist
							on a desktop environment to get started.
						</Text>

						<Button
							mt="lg"
							variant="gradient"
							onClick={() => adapter.openUrl("https://surrealdb.com/surrealist")}
							rightSection={<Icon path={iconOpen} />}
						>
							Read more about Surrealist
						</Button>
					</Stack>
				</Center>
			)}

			<Flex
				direction="column"
				flex={1}
				pos="relative"
			>
				<ScrollArea
					scrollbars="y"
					type="never"
					pos="fixed"
					component="aside"
					top={0}
					left={0}
					bottom={0}
					pt={nudgeSidebar ? 28 : 0}
					bg={isLight ? "slate.0" : "slate.9"}
					viewportRef={ref}
					className={clsx(
						classes.sidebar,
						shouldExpand && classes.sidebarExpanded,
						mode === "wide" && classes.sidebarWide
					)}
				>
					<Flex
						direction="column"
						h="100%"
						px={16}
					>
						{sidebar?.(state)}
					</Flex>
				</ScrollArea>

				<Group
					p="sm"
					gap="sm"
					pos="relative"
					align="center"
					wrap="nowrap"
					className={classes.toolbar}
					h={64}
				>
					<Box w={mode === "wide" ? 197 : 56} />
					{toolbar?.(state)}
				</Group>

				<Box p="sm" className={classes.wrapper}>
					<Box w={mode === "wide" ? 190 : 49} />
					<Box className={classes.content}>
						{children}
					</Box>
				</Box>
			</Flex>
		</div>
	);
}