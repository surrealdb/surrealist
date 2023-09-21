import classes from "./style.module.scss";
import surrealistLogo from "~/assets/icon.png";

import {
	ActionIcon,
	Box,
	Button,
	Center,
	clsx,
	Group,
	Image,
	NavLink,
	Paper,
	Popover,
	Stack,
	Text,
	Title,
	useMantineTheme,
} from "@mantine/core";

import { Spacer } from "../Spacer";
import { actions, store, useStoreValue } from "~/store";
import { useStable } from "~/hooks/stable";
import { uid } from "radash";
import { MouseEvent, PropsWithChildren, useEffect, useState } from "react";
import { mod, showError, updateConfig, updateTitle } from "~/util/helpers";
import { Toolbar } from "../Toolbar";
import { useActiveTab } from "~/hooks/environment";
import { showNotification } from "@mantine/notifications";
import { useIsLight } from "~/hooks/theme";
import { mdiClose, mdiConsole } from "@mdi/js";
import { Icon } from "../Icon";
import { Splitter } from "../Splitter";
import { ConsolePane } from "../ConsolePane";
import { QueryView } from "~/views/query/QueryView";
import { ExplorerView } from "~/views/explorer/ExplorerView";
import { ViewMode } from "~/types";
import { useHotkeys } from "@mantine/hooks";
import { VIEW_MODES } from "~/constants";
import { DesignerView } from "~/views/designer/DesignerView";
import { AuthenticationView } from "~/views/authentication/AuthenticationView";
import { adapter } from "~/adapter";
import { DesktopAdapter } from "~/adapter/desktop";
import { fetchDatabaseSchema } from "~/util/schema";
import { isConnectionValid, mergeConnections } from "~/util/environments";
import { useLater } from "~/hooks/later";
import { TabCreator } from "./creator";
import { TabEditor } from "./editor";
import { getSurreal, openSurrealConnection } from "~/util/connection";

function ViewSlot(props: PropsWithChildren<{ visible: boolean }>) {
	return <div style={{ display: props.visible ? "initial" : "none" }}>{props.children}</div>;
}

export function Scaffold() {
	const isLight = useIsLight();
	const theme = useMantineTheme();
	const activeTab = useStoreValue((state) => state.config.activeTab);
	const environments = useStoreValue((state) => state.config.environments);
	const autoConnect = useStoreValue((state) => state.config.autoConnect);
	const enableConsole = useStoreValue((state) => state.config.enableConsole);
	const isConnected = useStoreValue((state) => state.isConnected);
	const isQuerying = useStoreValue((state) => state.isQueryActive);
	const tabInfo = useActiveTab();

	const [isConnecting, setIsConnecting] = useState(false);
	const [isViewListing, setIsViewListing] = useState(false);

	const setIsConnected = useStable((value: boolean) => {
		store.dispatch(actions.setIsConnected(value));
	});

	const openConnection = useStable((e?: MouseEvent, silent?: boolean) => {
		e?.stopPropagation();

		if (isConnecting || !activeTab) {
			return;
		}

		try {
			openSurrealConnection({
				connection: mergedInfoDetails,
				onConnect() {
					setIsConnecting(false);
					setIsConnected(true);
					fetchDatabaseSchema();
				},
				onDisconnect(code, reason) {
					setIsConnecting(false);
					setIsConnected(false);

					if (code != 1000 && !silent) {
						const subtitle = code === 1006 ? "Unexpected connection close" : reason || `Unknown reason`;

						showNotification({
							color: "red.4",
							bg: "red.6",
							message: (
								<div>
									<Text color="white" weight={600}>
										Connection Closed
									</Text>
									<Text color="white" opacity={0.8} size="sm">
										{subtitle} ({code})
									</Text>
								</div>
							),
						});
					}
				},
			});

			setIsConnecting(true);
		} catch (err: any) {
			showError("Failed to open connection", err.message);
		}
	});

	const scheduleConnect = useLater(openConnection);

	const sendQuery = useStable(async (override?: string) => {
		if (tabInfo?.activeView !== "query") {
			return;
		}

		if (!isConnected) {
			showNotification({
				message: "You must be connected to send a query",
			});
			return;
		}

		const { query, name } = tabInfo!;
		const variables = tabInfo!.variables ? JSON.parse(tabInfo!.variables) : undefined;

		try {
			const response = await getSurreal()?.query(override?.trim() || query, variables);

			store.dispatch(
				actions.updateTab({
					id: activeTab!,
					lastResponse: response,
				})
			);
		} catch (err: any) {
			store.dispatch(
				actions.updateTab({
					id: activeTab!,
					lastResponse: [
						{
							status: "ERR",
							detail: err.message,
						},
					],
				})
			);
		}

		store.dispatch(
			actions.addHistoryEntry({
				id: uid(5),
				query: query,
				tabName: name,
				timestamp: Date.now(),
			})
		);

		await updateConfig();
	});

	const closeConnection = useStable((e?: MouseEvent) => {
		e?.stopPropagation();
		getSurreal()?.close();
		setIsConnecting(false);
		setIsConnected(false);
	});

	const setViewMode = useStable((id: ViewMode) => {
		setIsViewListing(false);

		store.dispatch(
			actions.updateTab({
				id: activeTab!,
				activeView: id,
			})
		);

		updateConfig();
		updateTitle();
	});

	const revealConsole = useStable((e: MouseEvent) => {
		e.stopPropagation();
		store.dispatch(actions.setConsoleEnabled(!enableConsole));
	});

	const openTabCreator = useStable((envId?: string) => {
		store.dispatch(
			actions.openTabCreator({
				environment: envId,
			})
		);
	});

	const createNewTab = useStable(() => {
		openTabCreator();
	});

	const openTabEditor = useStable(() => {
		if (!tabInfo) {
			return;
		}

		store.dispatch(actions.openTabEditor(tabInfo.id));
	});

	const handleActiveChange = useStable(async () => {
		if (isConnected) {
			getSurreal()?.close();
		}

		await updateConfig();

		if (autoConnect) {
			openConnection();
		}
	});

	const envInfo = environments.find((e) => e.id === tabInfo?.environment);
	const mergedInfoDetails = mergeConnections(tabInfo?.connection || {}, envInfo?.connection || {});
	const detailsValid = isConnectionValid(mergedInfoDetails);

	const borderColor = theme.fn.themeColor(isConnected ? "surreal" : detailsValid ? "light" : "red");
	const viewMode = tabInfo?.activeView || "query";
	const viewInfo = VIEW_MODES.find((v) => v.id == viewMode)!;
	const isDesktop = adapter instanceof DesktopAdapter;

	const handleSendQuery = useStable((e: MouseEvent) => {
		e.stopPropagation();
		sendQuery();
	});

	const relativeViewMode = useStable((value: number) => {
		const current = VIEW_MODES.findIndex((v: any) => v.id == viewMode);
		const next = mod(current + value, VIEW_MODES.length);

		setViewMode(VIEW_MODES[next].id);
	});

	useEffect(() => {
		if (activeTab && autoConnect) {
			detailsValid ? openConnection(undefined, true) : closeConnection();
		}
	}, [autoConnect, activeTab]);

	useHotkeys(
		[
			["ctrl+arrowLeft", () => relativeViewMode(-1)],
			["ctrl+arrowRight", () => relativeViewMode(1)],
		],
		[]
	);

	useHotkeys([
		["F9", () => sendQuery()],
		["mod+Enter", () => sendQuery()],
	]);

	return (
		<div className={classes.root}>
			<Toolbar
				viewMode={viewMode}
				openConnection={scheduleConnect}
				closeConnection={closeConnection}
				onCreateTab={openTabCreator}
				onSaveEnvironments={scheduleConnect}
			/>

			{activeTab ? (
				<>
					<Group p="xs">
						<Popover
							opened={isViewListing}
							onChange={setIsViewListing}
							position="bottom-start"
							closeOnEscape
							transitionProps={{ duration: 0, exitDuration: 0 }}
							shadow={`0 8px 25px rgba(0, 0, 0, ${isLight ? 0.2 : 0.75})`}
							withArrow
						>
							<Popover.Target>
								<Button
									px="lg"
									h="100%"
									color="surreal.4"
									variant="gradient"
									title="Select view"
									onClick={() => setIsViewListing(!isViewListing)}>
									<Icon path={viewInfo.icon} left />
									{viewInfo.name}
								</Button>
							</Popover.Target>
							<Popover.Dropdown px="xs">
								<Stack spacing="xs">
									{VIEW_MODES.map((info) => {
										const isActive = info.id === viewMode;

										return (
											<Button
												key={info.id}
												w={264}
												px={0}
												h="unset"
												color={isActive ? "pink" : "blue"}
												variant={isActive ? "light" : "subtle"}
												className={classes.viewModeButton}
												onClick={() => setViewMode(info.id as ViewMode)}
											>
												<NavLink
													component="div"
													className={classes.viewModeContent}
													label={info.name}
													icon={<Icon color="surreal" path={info.icon} />}
													description={
														<Stack spacing={6}>
															{info.desc}
														</Stack>
													}
													styles={{
														label: {
															color: isLight ? "black" : "white",
															fontWeight: 600,
														},
														description: {
															whiteSpace: "normal",
														},
													}}
												/>
											</Button>
										);
									})}
								</Stack>
							</Popover.Dropdown>
						</Popover>
						<Group className={classes.inputWrapper}>
							<Paper
								className={clsx(
									classes.input,
									detailsValid && (!isConnected || viewMode === "query") && classes.inputWithButton
								)}
								onClick={openTabEditor}
								style={{ borderColor: borderColor }}>
								{isConnected ? (
									mergedInfoDetails.authMode == "none" ? (
										<Paper bg={isLight ? "light.0" : "light.6"} c={isLight ? "light.4" : "light.3"} fs="italic" px="xs">
											Anon
										</Paper>
									) : mergedInfoDetails.authMode == "scope" ? (
										<Paper bg={isLight ? "light.0" : "light.6"} c={isLight ? "light.4" : "light.3"} fs="italic" px="xs">
											{mergedInfoDetails.scope}
										</Paper>
									) : (
										<Paper bg={isLight ? "light.0" : "light.6"} c={isLight ? "light.6" : "white"} px="xs">
											{mergedInfoDetails.username}
										</Paper>
									)
								) : (
									<Paper bg="light" px="xs">
										<Text color="white" size="xs" py={2} weight={600}>
											OFFLINE
										</Text>
									</Paper>
								)}
								<Text color={isLight ? "light.6" : "white"}>{mergedInfoDetails.endpoint}</Text>
								<Spacer />
								{!detailsValid && (
									<Text color="red" mr="xs">
										Connection details incomplete
									</Text>
								)}
								{isDesktop && (
									<ActionIcon onClick={revealConsole} title="Toggle console">
										<Icon color="light.4" path={mdiConsole} />
									</ActionIcon>
								)}
								{isConnected && (
									<ActionIcon onClick={closeConnection} title="Disconnect">
										<Icon color="light.4" path={mdiClose} />
									</ActionIcon>
								)}
							</Paper>
							{detailsValid && (
								<>
									{isConnected ? (
										viewMode == "query" && (
											<Button
												color="surreal"
												onClick={handleSendQuery}
												className={classes.sendButton}
												title="Send Query (F9)"
												loading={isQuerying}
											>
												Send Query
											</Button>
										)
									) : (
										<Button color="light" className={classes.sendButton} onClick={openConnection}>
											{isConnecting ? "Connecting..." : "Connect"}
										</Button>
									)}
								</>
							)}
						</Group>
					</Group>

					<Box p="xs" className={classes.content}>
						<Splitter
							minSize={100}
							bufferSize={200}
							direction="vertical"
							endPane={isDesktop && enableConsole && <ConsolePane />}>
							<ViewSlot visible={viewMode == "query"}>
								<QueryView sendQuery={sendQuery} />
							</ViewSlot>

							<ViewSlot visible={viewMode == "explorer"}>
								<ExplorerView />
							</ViewSlot>

							<ViewSlot visible={viewMode == "designer"}>
								<DesignerView />
							</ViewSlot>

							<ViewSlot visible={viewMode == "auth"}>
								<AuthenticationView />
							</ViewSlot>
						</Splitter>
					</Box>
				</>
			) : (
				<Center h="100%">
					<div>
						<Image className={classes.emptyImage} src={surrealistLogo} width={120} mx="auto" />
						<Title color="light" align="center" mt="md">
							Surrealist
						</Title>
						<Text color="light.2" align="center">
							Open or create a new session to continue
						</Text>
						<Center mt="lg">
							<Button size="xs" onClick={createNewTab}>
								Create session
							</Button>
						</Center>
					</div>
				</Center>
			)}

			<TabCreator />

			<TabEditor onActiveChange={handleActiveChange} />
		</div>
	);
}
