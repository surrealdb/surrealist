import classes from "./style.module.scss";

import { Alert, Box, Center, Drawer, Flex, Group, Paper, Stack, Text } from "@mantine/core";
import { type FC, lazy, memo } from "react";
import { adapter, isDesktop } from "~/adapter";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { VIEW_MODES } from "~/constants";
import { useSetting } from "~/hooks/config";
import { useActiveConnection, useIsConnected } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useInterfaceStore } from "~/stores/interface";
import type { ViewMode } from "~/types";
import { iconWarning } from "~/util/icons";
import { themeColor } from "~/util/mantine";
import { SelectDatabase } from "./components/SelectDatabase";
import { DatabaseSidebar } from "./sidebar";
import { DatabaseToolbar } from "./toolbar";
import { LazyRoute } from "~/components/LazyRoute";
import { useCloudRoute } from "~/hooks/cloud";
import { useActiveView } from "~/hooks/routing";

const DatabaseSidebarLazy = memo(DatabaseSidebar);
const CloudPanel = lazy(() => import("../cloud-panel/view"));

const VIEW_COMPONENTS: Record<ViewMode, FC> = {
	query: lazy(() => import("./views/query/QueryView")),
	explorer: lazy(() => import("./views/explorer/ExplorerView")),
	graphql: lazy(() => import("./views/graphql/GraphqlView")),
	designer: lazy(() => import("./views/designer/DesignerView")),
	authentication: lazy(() => import("./views/authentication/AuthenticationView")),
	functions: lazy(() => import("./views/functions/FunctionsView")),
	models: lazy(() => import("./views/models/ModelsView")),
	documentation: lazy(() => import("./views/documentation/DocumentationView")),
};

export function DatabaseScreen() {
	const { setOverlaySidebar } = useInterfaceStore.getState();

	const isLight = useIsLight();
	const isCloud = useCloudRoute();
	const isConnected = useIsConnected();
	const connection = useActiveConnection();
	const overlaySidebar = useInterfaceStore((s) => s.overlaySidebar);
	const title = useInterfaceStore((s) => s.title);

	const [activeView] = useActiveView();
	const [sidebarMode] = useSetting("appearance", "sidebarMode");
	const customTitlebar = adapter.platform === "darwin" && isDesktop;

	const onCloseSidebar = useStable(() => {
		setOverlaySidebar(false);
	});

	const requestDatabase = !connection?.lastDatabase && activeView?.require === "database";
	const sidebarOffset = 25 + (sidebarMode === "wide" ? 190 : 49);

	return (
		<div
			className={classes.root}
			style={{
				backgroundColor: isLight
					? connection
						? themeColor("slate.0")
						: "white"
					: connection
						? themeColor("slate.9")
						: "black",
			}}
		>
			{customTitlebar && (
				<Flex
					data-tauri-drag-region
					className={classes.titlebar}
					justify="center"
					align="end"
				>
					{title}
				</Flex>
			)}

			<Flex
				direction="column"
				flex={1}
				pos="relative"
			>
				<DatabaseSidebarLazy
					sidebarMode={sidebarMode}
					withTitlebarOffset={customTitlebar}
					visibleFrom="md"
				/>

				<Box
					m="lg"
					mt={customTitlebar ? "sm" : "lg"}
					className={classes.wrapper}
					__vars={{
						"--offset": `${sidebarOffset}px`,
					}}
				>
					{!isCloud && (
						<Group
							gap="md"
							pos="relative"
							align="center"
							wrap="nowrap"
							className={classes.toolbar}
						>
							<DatabaseToolbar />
						</Group>
					)}
					<Stack
						flex={1}
						pos="relative"
					>
						{requestDatabase && (
							<Center flex={1}>
								<Paper
									radius="md"
									p="xl"
									w={500}
								>
									<PrimaryTitle>Before you continue...</PrimaryTitle>
									<Text mt="md">
										Please select a namespace and database before accessing the{" "}
										{activeView?.name} view. You can use the buttons below to
										choose an existing namespace and database, or create new
										ones.
									</Text>
									<SelectDatabase
										withNamespace
										withDatabase
										mt="xl"
									/>
									{!isConnected && (
										<Alert
											mt="xl"
											color="orange"
											icon={<Icon path={iconWarning} />}
										>
											You must be connected before selecting a namespace and
											database
										</Alert>
									)}
								</Paper>
							</Center>
						)}

						{Object.values(VIEW_MODES).map((mode) => (
							<LazyRoute
								key={mode.id}
								path={mode.id}
								disabled={mode.require === "database" && requestDatabase}
								component={VIEW_COMPONENTS[mode.id]}
							/>
						))}

						<LazyRoute
							path={/^\/cloud\/?.*$/}
							component={CloudPanel}
						/>
					</Stack>
				</Box>
			</Flex>

			<Drawer
				opened={overlaySidebar}
				onClose={onCloseSidebar}
				size={275}
			>
				<DatabaseSidebarLazy
					sidebarMode="fill"
					withTitlebarOffset={customTitlebar}
				/>
			</Drawer>
		</div>
	);
}
