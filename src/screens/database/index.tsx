import classes from "./style.module.scss";

import { Alert, Box, Center, Drawer, Flex, Group, Paper, Stack, Text } from "@mantine/core";
import { type FC, Suspense, lazy, memo } from "react";
import { HtmlPortalNode, InPortal, OutPortal, createHtmlPortalNode } from "react-reverse-portal";
import { Redirect, Route, Switch } from "wouter";
import { adapter, isDesktop } from "~/adapter";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { VIEW_MODES } from "~/constants";
import { useCloudRoute, useSurrealCloud } from "~/hooks/cloud";
import { useSetting } from "~/hooks/config";
import { useActiveConnection, useIsConnected } from "~/hooks/connection";
import { useActiveView } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useInterfaceStore } from "~/stores/interface";
import type { ViewInfo, ViewMode } from "~/types";
import { iconWarning } from "~/util/icons";
import { themeColor } from "~/util/mantine";
import CloudView from "../cloud-panel/view";
import { SelectDatabase } from "./components/SelectDatabase";
import { DatabaseSidebar } from "./sidebar";
import { DatabaseToolbar } from "./toolbar";
import AuthenticationView from "./views/authentication/AuthenticationView";
import DesignerView from "./views/designer/DesignerView";
import DocumentationView from "./views/documentation/DocumentationView";
import ExplorerView from "./views/explorer/ExplorerView";
import FunctionsView from "./views/functions/FunctionsView";
import GraphqlView from "./views/graphql/GraphqlView";
import ModelsView from "./views/models/ModelsView";
import QueryView from "./views/query/QueryView";

const DatabaseSidebarLazy = memo(DatabaseSidebar);

const PORTAL_OPTIONS = {
	attributes: {
		style: "height: 100%; display: flex; flex-direction: column;",
	},
};

const VIEW_PORTALS: Record<ViewMode, HtmlPortalNode> = {
	query: createHtmlPortalNode(PORTAL_OPTIONS),
	explorer: createHtmlPortalNode(PORTAL_OPTIONS),
	graphql: createHtmlPortalNode(PORTAL_OPTIONS),
	designer: createHtmlPortalNode(PORTAL_OPTIONS),
	authentication: createHtmlPortalNode(PORTAL_OPTIONS),
	functions: createHtmlPortalNode(PORTAL_OPTIONS),
	models: createHtmlPortalNode(PORTAL_OPTIONS),
	documentation: createHtmlPortalNode(PORTAL_OPTIONS),
};

const VIEW_COMPONENTS: Record<ViewMode, FC> = {
	query: QueryView,
	explorer: ExplorerView,
	graphql: GraphqlView,
	designer: DesignerView,
	authentication: AuthenticationView,
	functions: FunctionsView,
	models: ModelsView,
	documentation: DocumentationView,
};

export function DatabaseScreen() {
	const { setOverlaySidebar } = useInterfaceStore.getState();

	const isLight = useIsLight();
	const isCloud = useCloudRoute();
	const cloudEnabled = useSurrealCloud();
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
						<Switch>
							{Object.values(VIEW_MODES).map((mode) =>
								requestDatabase ? (
									<DatabaseSelection
										key={mode.id}
										info={mode}
									/>
								) : (
									<Route
										key={mode.id}
										path={`/${mode.id}`}
									>
										<OutPortal node={VIEW_PORTALS[mode.id]} />
									</Route>
								),
							)}

							{cloudEnabled && (
								<Route path="/cloud/*?">
									<CloudView />
								</Route>
							)}

							<Route>
								<Redirect to="/query" />
							</Route>
						</Switch>
					</Stack>
				</Box>
			</Flex>

			{Object.values(VIEW_MODES).map((mode) => {
				const Content = VIEW_COMPONENTS[mode.id];

				return (
					<InPortal
						key={mode.id}
						node={VIEW_PORTALS[mode.id]}
					>
						<Suspense fallback={null}>
							<Content />
						</Suspense>
					</InPortal>
				);
			})}

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

interface DatabaseSelectionProps {
	info: ViewInfo;
}

function DatabaseSelection({ info }: DatabaseSelectionProps) {
	const isConnected = useIsConnected();

	return (
		<Center flex={1}>
			<Paper
				radius="md"
				p="xl"
				w={500}
			>
				<PrimaryTitle>Before you continue...</PrimaryTitle>
				<Text mt="md">
					Please select a namespace and database before accessing the {info?.name} view.
					You can use the buttons below to choose an existing namespace and database, or
					create new ones.
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
						You must be connected before selecting a namespace and database
					</Alert>
				)}
			</Paper>
		</Center>
	);
}
