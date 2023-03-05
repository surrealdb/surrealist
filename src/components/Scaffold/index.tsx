import classes from "./style.module.scss";
import surrealistLogo from "~/assets/icon.png";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Center,
  Group,
  Image,
  Modal,
  NavLink,
  Paper,
  Popover,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { Spacer } from "../Spacer";
import { actions, store, useStoreValue } from "~/store";
import { useStable } from "~/hooks/stable";
import { uid } from "radash";
import { MouseEvent, PropsWithChildren, useEffect, useState } from "react";
import { mod, showError, updateConfig, updateTitle } from "~/util/helpers";
import { TabBar } from "../TabBar";
import { Form } from "../Form";
import { useImmer } from "use-immer";
import { getSurreal, openSurreal, SurrealConnection } from "~/surreal";
import { useActiveTab, useTabCreator } from "~/hooks/tab";
import { showNotification } from "@mantine/notifications";
import { useIsLight } from "~/hooks/theme";
import { mdiClose, mdiConsole } from "@mdi/js";
import { Icon } from "../Icon";
import { Splitter } from "../Splitter";
import { ConsolePane } from "../ConsolePane";
import { QueryView } from "~/views/query/QueryView";
import { ExplorerView } from "~/views/explorer/ExplorerView";
import { AuthMode, ViewMode } from "~/typings";
import { VisualizerView } from "~/views/visualizer/VisualizerView";
import { useHotkeys } from "@mantine/hooks";
import { AUTH_MODES, VIEW_MODES } from "~/constants";
import { DesignerView } from "~/views/designer/DesignerView";
import { AuthenticationView } from "~/views/authentication/AuthenticationView";
import { adapter } from "~/adapter";
import { DesktopAdapter } from "~/adapter/desktop";
import { fetchDatabaseSchema } from "~/util/schema";

function ViewSlot(props: PropsWithChildren<{ visible: boolean }>) {
  return (
    <div style={{ display: props.visible ? "initial" : "none" }}>
      {props.children}
    </div>
  );
}

export function Scaffold() {
  const isLight = useIsLight();
  const theme = useMantineTheme();
  const activeTab = useStoreValue((state) => state.activeTab);
  const autoConnect = useStoreValue((state) => state.config.autoConnect);
  const servePending = useStoreValue((state) => state.servePending);
  const isServing = useStoreValue((state) => state.isServing);
  const enableConsole = useStoreValue((state) => state.config.enableConsole);
  const createTab = useTabCreator();
  const tabInfo = useActiveTab();

  const [isOnline, setIsOnline] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isViewListing, setIsViewListing] = useState(false);

  const createNewTab = useStable(async () => {
    const tabId = createTab("New tab");

    store.dispatch(actions.setActiveTab(tabId));

    updateTitle();
    await updateConfig();
  });

  const [editingInfo, setEditingInfo] = useState(false);
  const [infoDetails, setInfoDetails] = useImmer<SurrealConnection>({
    endpoint: "",
    namespace: "",
    database: "",
    username: "",
    password: "",
    authMode: "root",
    scope: "",
  });

  const openInfoEditor = useStable(() => {
    setEditingInfo(true);
    setInfoDetails(tabInfo!.connection);
  });

  const closeEditingInfo = useStable(() => {
    setEditingInfo(false);
  });

  const openConnection = useStable((e?: MouseEvent, silent?: boolean) => {
    e?.stopPropagation();

    if (isConnecting) {
      return;
    }

    const activeTab = store.getState().activeTab;
    const tabInfo = store
      .getState()
      .config.tabs.find((tab) => tab.id === activeTab);

    if (!tabInfo) {
      return;
    }

    try {
      openSurreal({
        connection: tabInfo.connection,
        onConnect() {
          setIsConnecting(false);
          setIsOnline(true);
          fetchDatabaseSchema();
        },
        onDisconnect(code, reason) {
          setIsConnecting(false);
          setIsOnline(false);

          if (code != 1000 && !silent) {
            const subtitle =
              code === 1006
                ? "Unexpected connection close"
                : reason || `Unknown reason`;

            showNotification({
              disallowClose: true,
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

  const sendQuery = useStable(async (override?: string) => {
    if (tabInfo?.activeView !== "query") {
      return;
    }

    if (!isOnline) {
      showNotification({
        message: "You must be connected to send a query",
      });
      return;
    }

    const { query, name } = tabInfo!;
    const variables = tabInfo!.variables
      ? JSON.parse(tabInfo!.variables)
      : undefined;

    try {
      const response = await getSurreal()?.query(
        override?.trim() || query,
        variables
      );

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

  const saveInfo = useStable(async () => {
    store.dispatch(
      actions.updateTab({
        id: activeTab!,
        connection: {
          ...infoDetails,
        },
      })
    );

    if (isOnline) {
      getSurreal()?.close();
    }

    await updateConfig();
    closeEditingInfo();

    if (autoConnect) {
      openConnection();
    }
  });

  const closeConnection = useStable((e?: MouseEvent) => {
    e?.stopPropagation();
    getSurreal()?.close();
    setIsConnecting(false);
    setIsOnline(false);
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

  useEffect(() => {
    if (autoConnect) {
      openConnection(undefined, true);
    }
  }, [autoConnect, activeTab]);

  const revealConsole = useStable((e: MouseEvent) => {
    e.stopPropagation();
    store.dispatch(actions.setConsoleEnabled(true));
  });

  const connectionSaveDisabled =
    !infoDetails.endpoint ||
    !infoDetails.namespace ||
    !infoDetails.database ||
    !infoDetails.username ||
    !infoDetails.password;
  const showConsole = enableConsole && (servePending || isServing);
  const borderColor = theme.fn.themeColor(isOnline ? "surreal" : "light");
  const viewMode = tabInfo?.activeView || "query";
  const viewInfo = VIEW_MODES.find((v) => v.id == viewMode)!;
  const isDesktop = adapter instanceof DesktopAdapter;

  const handleSendQuery = useStable((e: MouseEvent) => {
    e.stopPropagation();
    sendQuery();
  });

  const relativeViewMode = useStable((value: number) => {
    let available = VIEW_MODES;

    if (!(adapter instanceof DesktopAdapter)) {
      available = available.filter((v: any) => !v.desktop) as any;
    }

    const current = available.findIndex((v: any) => v.id == viewMode);
    const next = mod(current + value, available.length);

    setViewMode(VIEW_MODES[next].id);
  });

  useHotkeys(
    [
      [
        "ctrl+arrowLeft",
        () => {
          relativeViewMode(-1);
        },
      ],
      [
        "ctrl+arrowRight",
        () => {
          relativeViewMode(1);
        },
      ],
    ],
    []
  );

  useHotkeys([
    ["F9", () => sendQuery()],
    ["mod+Enter", () => sendQuery()],
  ]);

  return (
    <div className={classes.root}>
      <TabBar
        viewMode={viewMode}
        openConnection={openConnection}
        closeConnection={closeConnection}
        onCreateTab={createNewTab}
        onSwitchTab={closeConnection}
      />

      {activeTab ? (
        <>
          <Group p="xs">
            <Popover
              opened={isViewListing}
              onChange={setIsViewListing}
              position="bottom-start"
              exitTransitionDuration={75}
              closeOnEscape
              shadow="lg"
              withArrow
            >
              <Popover.Target>
                <Button
                  px="lg"
                  h="100%"
                  color="surreal.4"
                  variant="gradient"
                  title="Select view"
                  onClick={() => setIsViewListing(!isViewListing)}
                >
                  <Icon path={viewInfo.icon} left />
                  {viewInfo.name}
                </Button>
              </Popover.Target>
              <Popover.Dropdown px="xs">
                <Stack spacing="xs">
                  {VIEW_MODES.map((info) => {
                    const isActive = info.id === viewMode;
                    const isDisabled = !isDesktop && info.desktop;

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
                        bg={isDisabled ? "transparent !important" : undefined}
                        disabled={isDisabled}
                      >
                        <NavLink
                          component="div"
                          className={classes.viewModeContent}
                          label={info.name}
                          icon={
                            <Icon
                              color={isDisabled ? "light.5" : "surreal"}
                              path={info.icon}
                            />
                          }
                          description={
                            <Stack spacing={6}>
                              {info.desc}
                              {isDisabled && (
                                <div>
                                  <Badge
                                    color="blue"
                                    variant="filled"
                                    radius="sm"
                                  >
                                    Surreal Desktop
                                  </Badge>
                                </div>
                              )}
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
            <Paper onClick={openInfoEditor} className={classes.inputBar}>
              <Paper
                className={classes.input}
                onClick={openInfoEditor}
                style={{
                  borderColor: borderColor,
                  borderRight:
                    viewMode != "query" && isOnline
                      ? "2px solid var(--mantine-color-surreal-5)"
                      : undefined,
                  borderRadius:
                    viewMode != "query" && isOnline
                      ? "8px 8px 8px 8px"
                      : undefined,
                }}
              >
                {!isOnline ? (
                  <Paper bg="light" px="xs">
                    <Text color="white" size="xs" py={2} weight={600}>
                      OFFLINE
                    </Text>
                  </Paper>
                ) : tabInfo!.connection.authMode == "none" ? (
                  <Paper
                    bg={isLight ? "light.0" : "light.6"}
                    c={isLight ? "light.4" : "light.3"}
                    fs="italic"
                    px="xs"
                  >
                    Anon
                  </Paper>
                ) : (
                  <Paper
                    bg={isLight ? "light.0" : "light.6"}
                    c={isLight ? "light.6" : "white"}
                    px="xs"
                  >
                    {tabInfo!.connection.username}
                  </Paper>
                )}
                <Text color={isLight ? "light.6" : "white"}>
                  {tabInfo!.connection.endpoint}
                </Text>
                <Spacer />
                {(servePending || isServing) && !showConsole && (
                  <ActionIcon onClick={revealConsole} title="Reveal console">
                    <Icon color="light.4" path={mdiConsole} />
                  </ActionIcon>
                )}
                {(isConnecting || isOnline) && (
                  <ActionIcon onClick={closeConnection} title="Disconnect">
                    <Icon color="light.4" path={mdiClose} />
                  </ActionIcon>
                )}
              </Paper>
              {!isOnline ? (
                <Button
                  color="light"
                  className={classes.sendButton}
                  onClick={openConnection}
                  style={{ borderColor: borderColor }}
                >
                  {isConnecting ? "Connecting..." : "Connect"}
                </Button>
              ) : viewMode == "query" ? (
                <Button
                  color="surreal"
                  onClick={handleSendQuery}
                  className={classes.sendButton}
                  title="Send Query (F9)"
                >
                  Send Query
                </Button>
              ) : (
                <div />
              )}
            </Paper>
          </Group>

          <Box p="xs" className={classes.content}>
            <Splitter
              minSize={100}
              bufferSize={53}
              direction="vertical"
              endPane={showConsole && <ConsolePane />}
            >
              <ViewSlot visible={viewMode == "query"}>
                <QueryView isOnline={isOnline} sendQuery={sendQuery} />
              </ViewSlot>

              <ViewSlot visible={viewMode == "explorer"}>
                <ExplorerView isOnline={isOnline} />
              </ViewSlot>

              <ViewSlot visible={viewMode == "visualizer"}>
                <VisualizerView isOnline={isOnline} />
              </ViewSlot>

              {isDesktop && (
                <ViewSlot visible={viewMode == "designer"}>
                  <DesignerView isOnline={isOnline} />
                </ViewSlot>
              )}

              {isDesktop && (
                <ViewSlot visible={viewMode == "auth"}>
                  <AuthenticationView isOnline={isOnline} />
                </ViewSlot>
              )}
            </Splitter>
          </Box>
        </>
      ) : (
        <Center h="100%">
          <div>
            <Image
              className={classes.emptyImage}
              src={surrealistLogo}
              width={120}
              mx="auto"
            />
            <Title color="light" align="center" mt="md">
              Surrealist
            </Title>
            <Text color="light.2" align="center">
              Open or create a new tab to continue
            </Text>
            <Center mt="lg">
              <Button size="xs" onClick={createNewTab}>
                Create tab
              </Button>
            </Center>
          </div>
        </Center>
      )}

      {/* ANCHOR Connection details modal */}
      <Modal
        opened={editingInfo}
        onClose={closeEditingInfo}
        size="lg"
        title={
          <Title size={16} color={isLight ? "light.6" : "white"}>
            Connection details
          </Title>
        }
      >
        <Form onSubmit={saveInfo}>
          <SimpleGrid cols={2} spacing="xl">
            <Stack>
              <TextInput
                required
                label="Endpoint URL"
                value={infoDetails.endpoint}
                onChange={(e) =>
                  setInfoDetails((draft) => {
                    draft.endpoint = e.target.value;
                  })
                }
                autoFocus
              />
              <TextInput
                required
                label="Namespace"
                value={infoDetails.namespace}
                onChange={(e) =>
                  setInfoDetails((draft) => {
                    draft.namespace = e.target.value;
                  })
                }
              />
              <TextInput
                required
                label="Database"
                value={infoDetails.database}
                onChange={(e) =>
                  setInfoDetails((draft) => {
                    draft.database = e.target.value;
                  })
                }
              />
            </Stack>
            <Stack>
              <Select
                label="Authentication mode"
                value={infoDetails.authMode}
                onChange={(value) =>
                  setInfoDetails((draft) => {
                    draft.authMode = value as AuthMode;
                  })
                }
                data={AUTH_MODES}
              />
              <TextInput
                label="Username"
                disabled={infoDetails.authMode == "none"}
                required={infoDetails.authMode != "none"}
                value={infoDetails.username}
                onChange={(e) =>
                  setInfoDetails((draft) => {
                    draft.username = e.target.value;
                  })
                }
              />
              <TextInput
                label="Password"
                disabled={infoDetails.authMode == "none"}
                required={infoDetails.authMode != "none"}
                value={infoDetails.password}
                onChange={(e) =>
                  setInfoDetails((draft) => {
                    draft.password = e.target.value;
                  })
                }
              />
              <TextInput
                label="Scope"
                disabled={infoDetails.authMode != "scope"}
                required={infoDetails.authMode == "scope"}
                value={infoDetails.scope}
                onChange={(e) =>
                  setInfoDetails((draft) => {
                    draft.scope = e.target.value;
                  })
                }
              />
            </Stack>
          </SimpleGrid>
          <Group mt="lg">
            <Button
              color={isLight ? "light.5" : "light.3"}
              variant="light"
              onClick={closeEditingInfo}
            >
              Close
            </Button>
            <Spacer />
            <Button disabled={connectionSaveDisabled} type="submit">
              Save details
            </Button>
          </Group>
        </Form>
      </Modal>
    </div>
  );
}
