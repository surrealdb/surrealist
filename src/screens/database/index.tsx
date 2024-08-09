import classes from "./style.module.scss";
import surrealistUrl from "~/assets/images/surrealist.webp";
import clsx from "clsx";
import { ViewMode } from "~/types";
import { DatabaseSidebar } from "./sidebar";
import { DatabaseToolbar } from "./toolbar";
import { HtmlPortalNode, InPortal, OutPortal, createHtmlPortalNode } from "react-reverse-portal";
import { Suspense, lazy, useLayoutEffect, useState } from "react";
import { useConfigStore } from "~/stores/config";
import { CloudView } from "~/screens/cloud-manage/view";
import { Center, Stack, Button, Flex, ScrollArea, Group, Box, Text, Image, Paper, Alert } from "@mantine/core";
import { adapter, isDesktop } from "~/adapter";
import { useBoolean } from "~/hooks/boolean";
import { useSetting } from "~/hooks/config";
import { useIsLight } from "~/hooks/theme";
import { useInterfaceStore } from "~/stores/interface";
import { isMobile } from "~/util/helpers";
import { iconOpen, iconWarning } from "~/util/icons";
import { themeColor } from "~/util/mantine";
import { Icon } from "~/components/Icon";
import { useActiveConnection, useIsConnected } from "~/hooks/connection";
import { VIEW_MODES } from "~/constants";
import { SelectDatabase } from "./components/SelectDatabase";
import { PrimaryTitle } from "~/components/PrimaryTitle";

const PORTAL_ATTRS = {
	attributes: {
		style: "height: 100%; display: flex; flex-direction: column;"
	}
};

const VIEW_PORTALS: Record<ViewMode, HtmlPortalNode> = {
	query: createHtmlPortalNode(PORTAL_ATTRS),
	explorer: createHtmlPortalNode(PORTAL_ATTRS),
	graphql: createHtmlPortalNode(PORTAL_ATTRS),
	designer: createHtmlPortalNode(PORTAL_ATTRS),
	authentication: createHtmlPortalNode(PORTAL_ATTRS),
	functions: createHtmlPortalNode(PORTAL_ATTRS),
	models: createHtmlPortalNode(PORTAL_ATTRS),
	documentation: createHtmlPortalNode(PORTAL_ATTRS),
	cloud: createHtmlPortalNode(PORTAL_ATTRS),
};

const QueryView = lazy(() => import('./views/query/QueryView'));
const ExplorerView = lazy(() => import('./views/explorer/ExplorerView'));
const GraphqlView = lazy(() => import('./views/graphql/GraphqlView'));
const DesignerView = lazy(() => import('./views/designer/DesignerView'));
const AuthenticationView = lazy(() => import('./views/authentication/AuthenticationView'));
const FunctionsView = lazy(() => import('./views/functions/FunctionsView'));
const ModelsView = lazy(() => import('./views/models/ModelsView'));
const DocumentationView = lazy(() => import('./views/documentation/DocumentationView'));

export function DatabaseScreen() {
	const isLight = useIsLight();
	const isConnected = useIsConnected();
	const connection = useActiveConnection();
	const title = useInterfaceStore((s) => s.title);

	const [mode] = useSetting("appearance", "sidebarMode");
	const [canHoverSidebar, hoverSidebarHandle] = useBoolean(true);

	const canHover = mode === "expandable" && canHoverSidebar;
	const customTitlebar = adapter.platform === "darwin" && isDesktop;

	const viewMode = useConfigStore(s => s.activeView);
	const viewNode = VIEW_PORTALS[viewMode];
	const viewInfo = VIEW_MODES[viewMode];

	const [loaded, setLoaded] = useState<ViewMode[]>([]);

	useLayoutEffect(() => {
		setLoaded((prev) => {
			if (!prev.includes(viewMode)) {
				return [...prev, viewMode];
			}

			return prev;
		});
	}, [viewMode]);

	const requireDatabase = !connection?.lastDatabase && viewInfo?.require === "database";

	return (
		<div
			className={classes.root}
			style={{
				backgroundColor: isLight
					? (connection ? themeColor("slate.0") : "white")
					: (connection ? themeColor("slate.9") : "black")
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

			{isMobile() && (
				<Center
					pos="fixed"
					inset={0}
					bg="slate.9"
					style={{ zIndex: 1000 }}
				>
					<Stack maw={250} mx="auto">
						<Image src={surrealistUrl} />

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
					bg={isLight ? "slate.0" : "slate.9"}
					onMouseEnter={hoverSidebarHandle.open}
					className={clsx(
						classes.sidebar,
						canHover && classes.sidebarExpandable,
						mode === "wide" && classes.sidebarWide
					)}
				>
					<Flex
						pt={customTitlebar ? 38 : 22}
						direction="column"
						h="100%"
						px={16}
					>
						<DatabaseSidebar
							sidebarMode={mode}
							onNavigate={hoverSidebarHandle.close}
							onItemHover={hoverSidebarHandle.open}
						/>
					</Flex>
				</ScrollArea>

				<Box
					m="lg"
					mt={customTitlebar ? "sm" : "lg"}
					ml={25 + (mode === "wide" ? 190 : 49)}
					className={classes.wrapper}
				>
					{viewMode !== "cloud" && (
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
						{requireDatabase ? (
							<Center flex={1}>
								<Paper
									radius="md"
									p="xl"
									w={500}
								>
									<PrimaryTitle>
										Before you continue...
									</PrimaryTitle>
									<Text mt="md">
										Please select a namespace and database before accessing the {viewInfo?.name} view.
										You can use the buttons below to choose an existing namespace and database, or create new ones.
									</Text>
									<SelectDatabase
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
						) : (
							viewNode && <OutPortal node={viewNode} />
						)}

						{loaded.includes("cloud") && (
							<InPortal node={VIEW_PORTALS.cloud}>
								<Suspense fallback={null}>
									<CloudView />
								</Suspense>
							</InPortal>
						)}

						{loaded.includes("query") && (
							<InPortal node={VIEW_PORTALS.query}>
								<Suspense fallback={null}>
									<QueryView />
								</Suspense>
							</InPortal>
						)}

						{loaded.includes("explorer") && (
							<InPortal node={VIEW_PORTALS.explorer}>
								<Suspense fallback={null}>
									<ExplorerView />
								</Suspense>
							</InPortal>
						)}

						{loaded.includes("graphql") && (
							<InPortal node={VIEW_PORTALS.graphql}>
								<Suspense fallback={null}>
									<GraphqlView />
								</Suspense>
							</InPortal>
						)}

						{loaded.includes("designer") && (
							<InPortal node={VIEW_PORTALS.designer}>
								<Suspense fallback={null}>
									<DesignerView />
								</Suspense>
							</InPortal>
						)}

						{loaded.includes("authentication") && (
							<InPortal node={VIEW_PORTALS.authentication}>
								<Suspense fallback={null}>
									<AuthenticationView />
								</Suspense>
							</InPortal>
						)}

						{loaded.includes("functions") && (
							<InPortal node={VIEW_PORTALS.functions}>
								<Suspense fallback={null}>
									<FunctionsView />
								</Suspense>
							</InPortal>
						)}

						{loaded.includes("models") && (
							<InPortal node={VIEW_PORTALS.models}>
								<Suspense fallback={null}>
									<ModelsView />
								</Suspense>
							</InPortal>
						)}

						{loaded.includes("documentation") && (
							<InPortal node={VIEW_PORTALS.documentation}>
								<Suspense fallback={null}>
									<DocumentationView />
								</Suspense>
							</InPortal>
						)}
					</Stack>
				</Box>
			</Flex>
		</div>
	);
}