import classes from "./style.module.scss";
import { Box, Button, Divider, Group, Menu, Popover, ScrollArea, SimpleGrid, Stack, TextInput } from "@mantine/core";
import {
	mdiDatabase,
	mdiPlus,
	mdiChevronRight,
	mdiMagnify,
	mdiClose,
	mdiPencil,
	mdiDotsVertical,
	mdiCursorText,
	mdiContentDuplicate,
	mdiPinOff,
	mdiPin,
	mdiCircle,
} from "@mdi/js";
import { Icon } from "../Icon";
import { SurrealistSession } from "~/types";
import { Text } from "@mantine/core";
import { useStable } from "~/hooks/stable";
import { updateTitle, applyOrder } from "~/util/helpers";
import { MouseEvent, useEffect, useMemo, useState } from "react";
import { useHotkeys, useInputState } from "@mantine/hooks";
import { Environments } from "./environments";
import { SyntheticEvent } from "react";
import { Sortable } from "../Sortable";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { useDatabaseStore } from "~/stores/database";

export interface SelectorProps {
	active: string | null;
	isLight: boolean;
	onCreateSession: (environment: string) => void;
}

export function Selector({ active, isLight, onCreateSession }: SelectorProps) {
	const isConnected = useDatabaseStore((s) => s.isConnected);
	const isConnecting = useDatabaseStore((s) => s.isConnecting);
	const setActiveSession = useConfigStore((s) => s.setActiveSession);
	const updateSession = useConfigStore((s) => s.updateSession);
	const removeSession = useConfigStore((s) => s.removeSession);
	const setSessions = useConfigStore((s) => s.setSessions);

	const openTabEditor = useInterfaceStore((s) => s.openTabEditor);
	const openTabCreator = useInterfaceStore((s) => s.openTabCreator);

	const [opened, setOpened] = useState(false);
	const [manageEnvs, setManageEnvs] = useState(false);
	const [viewingEnv, setViewingEnv] = useState("");
	const [renamingSession, setRenamingSession] = useState("");
	const [tabName, setTabName] = useInputState("");
	const [search, setSearch] = useInputState("");

	const sessions = useConfigStore((s) => s.tabs);
	const environments = useConfigStore((s) => s.environments);
	const tabSearch = useConfigStore((s) => s.tabSearch);

	const session = sessions.find((session) => session.id === active);
	const environment = session && environments.find((env) => env.id === session.environment);

	const stopPropagation = useStable((e: any) => {
		e.stopPropagation();
	});

	const filteredTabs = useMemo(() => {
		const needle = search.toLowerCase();

		return sessions.filter((session) => session.environment === viewingEnv && (!needle || session.name.toLowerCase().includes(needle)));
	}, [sessions, viewingEnv, search]);

	const select = useStable((id: string) => {
		if (renamingSession) {
			return;
		}

		setActiveSession(id);

		updateTitle();
		setOpened(false);
	});

	const openSession = useStable((index: number) => {
		const session = filteredTabs[index];

		if (session) {
			select(session.id);
		}
	});

	const openEnvironment = useStable((id: string) => {
		setViewingEnv(id);
	});

	const createSession = useStable(() => {
		setOpened(false);
		onCreateSession(viewingEnv);
	});

	const handleRename = useStable((e: MouseEvent, id: string) => {
		e.stopPropagation();

		const current = sessions.find((session) => session.id === id)?.name || "";

		setRenamingSession(id);
		setTabName(current);
	});

	const handleEdit = useStable((e: MouseEvent, id: string) => {
		e.stopPropagation();

		setOpened(false);

		openTabEditor(id);
	});

	const handlePin = useStable((e: MouseEvent, id: string) => {
		e.stopPropagation();

		const pinned = sessions.find((session) => session.id === id)?.pinned ?? false;

		updateSession({
			id: id,
			pinned: !pinned,
		});
	});

	const handleDuplicate = useStable((e: MouseEvent, id: string) => {
		e.stopPropagation();

		setOpened(false);

		const details = sessions.find((session) => session.id === id)?.connection || {};

		openTabCreator({
			environment: viewingEnv,
			connection: details,
		});
	});

	const handleDelete = useStable((e: MouseEvent, id: string) => {
		e.stopPropagation();
		removeSession(id);
	});

	const saveRename = useStable((e: SyntheticEvent) => {
		if ("key" in e && e.key !== "Enter") {
			return;
		}

		const info = sessions.find((session) => session.id === renamingSession);

		if (!info) {
			return;
		}

		updateSession({
			...info,
			name: tabName,
		});

		setRenamingSession("");
		setTabName("");

		updateTitle();
	});

	const openEnvManager = useStable(() => {
		setManageEnvs(true);
		setOpened(false);
	});

	const closeEnvManager = useStable(() => {
		setManageEnvs(false);
	});

	const saveTabOrder = useStable((order: SurrealistSession[]) => {
		setSessions(applyOrder(sessions, order));
	});

	useEffect(() => {
		if (!viewingEnv) {
			const startEnv = environment?.id || environments[0]?.id;

			if (startEnv) {
				setViewingEnv(startEnv);
			}
		}
	}, [environments, environment]);

	useHotkeys(
		[
			["ctrl+1", () => openSession(0)],
			["ctrl+2", () => openSession(1)],
			["ctrl+3", () => openSession(2)],
			["ctrl+4", () => openSession(3)],
			["ctrl+5", () => openSession(4)],
			["ctrl+6", () => openSession(5)],
			["ctrl+7", () => openSession(6)],
			["ctrl+8", () => openSession(7)],
			["ctrl+9", () => openSession(8)],
			["ctrl+0", () => openSession(9)],
			["ctrl+n", () => createSession],
		],
		[]
	);

	return (
		<>
			<Popover
				opened={opened}
				onChange={setOpened}
				position="bottom-start"
				transitionProps={{ duration: 0, exitDuration: 0 }}
				shadow="0 8px 25px rgba(0, 0, 0, 0.35)"
				closeOnEscape
				withArrow
			>
				<Popover.Target>
					<Button px="xs" variant="subtle" color="light" onClick={() => setOpened(!opened)}>
						<Group gap={6}>
							<Icon path={mdiDatabase} />
							{session && environment ? (
								<>
									<Text>{environment.name}</Text>
									<Icon path={mdiChevronRight} color="dark.3" />
									<Text c={isLight ? "black" : "white"}>{session.name}</Text>
								</>
							) : (
								<Text c="light.4">Select tab</Text>
							)}

							<Icon
								path={mdiCircle}
								size={0.65}
								ml={4}
								color={isConnected ? "green" : isConnecting ? "orange" : "red"}
							/>
						</Group>
					</Button>
				</Popover.Target>
				<Popover.Dropdown px="xs">
					<SimpleGrid cols={2}>
						<Box mih={235} mah={350}>
							<ScrollArea h="calc(100% - 54px)">
								<Stack gap="xs">
									{environments.map((item) => {
										const isActive = item.id === viewingEnv;

										return (
											<Button
												key={item.id}
												w={264}
												px={12}
												c={isLight ? "black" : "white"}
												color={isActive ? (isLight ? "light.1" : "dark.7") : "light"}
												variant={isActive ? "filled" : "subtle"}
												className={classes.entryButton}
												onClick={() => openEnvironment(item.id)}
												rightSection={<Icon path={mdiChevronRight} color={isActive ? "dark.3" : "light.5"} size={1.15} />}
											>
												{item.name}
											</Button>
										);
									})}
								</Stack>
							</ScrollArea>

							<Divider color={isLight ? "light.0" : "dark.4"} my="xs" />

							<Button
								w={264}
								px={12}
								color="light"
								variant="subtle"
								className={classes.manageButton}
								onClick={openEnvManager}
								rightSection={<Icon path={mdiChevronRight} />}
							>
								Manage environments
							</Button>
						</Box>
						<Box mih={235} mah={300}>
							{tabSearch && (
								<TextInput
									placeholder="Search"
									variant="filled"
									leftSection={<Icon path={mdiMagnify} color="dark.3" />}
									style={{ flex: 1 }}
									value={search}
									onChange={setSearch}
									autoFocus
									mb="sm"
								/>
							)}
							<ScrollArea h={tabSearch ? "calc(100% - 102px)" : "calc(100% - 54px)"}>
								<Stack gap={6}>
									{filteredTabs.length === 0 && sessions.length > 0 && (
										<Text ta="center" py={7} c="dark.2">
											No tabs found
										</Text>
									)}

									<Sortable
										items={filteredTabs}
										disabled={!!search}
										onSorted={saveTabOrder}
										constraint={{
											distance: 10,
										}}
									>
										{({ item, handleProps }) => {
											const isActive = item.id === session?.id;
											const isRenaming = renamingSession == item.id;

											return isRenaming ? (
												<TextInput
													autoFocus
													variant="default"
													value={tabName}
													onChange={setTabName}
													onBlur={saveRename}
													onKeyDown={saveRename}
													leftSection={
														<Icon path={mdiPencil} color="blue" />
													}
													leftSectionWidth={42}
													styles={{
														input: {
															fontWeight: 600,
															color: isLight ? "black" : "white",
														},
													}}
												/>
											) : (
												<Button
													key={item.id}
													w={264}
													px={12}
													c={isLight ? "black" : "white"}
													color={isRenaming ? "light" : isActive ? "pink" : "light"}
													variant={isRenaming ? "outline" : isActive ? "light" : "subtle"}
													className={classes.entryButton}
													onClick={() => select(item.id)}
													{...handleProps}
													rightSection={
														<Menu
															shadow="md"
															width={200}
															position="right-start"
															closeOnItemClick={false}
															withinPortal
														>
															<Menu.Target>
																<div onClick={stopPropagation}>
																	<Icon path={mdiDotsVertical} style={{ cursor: 'pointer' }} />
																</div>
															</Menu.Target>

															<Menu.Dropdown onMouseDown={stopPropagation}>
																<Menu.Item
																	leftSection={<Icon path={mdiCursorText} />}
																	onClick={(e) => handleRename(e, item.id)}
																>
																	Rename
																</Menu.Item>
																<Menu.Item
																	leftSection={<Icon path={mdiPencil} />}
																	onClick={(e) => handleEdit(e, item.id)}
																>
																	Edit
																</Menu.Item>
																<Menu.Item
																	leftSection={<Icon path={item.pinned ? mdiPinOff : mdiPin} />}
																	onClick={(e) => handlePin(e, item.id)}
																>
																	{item.pinned ? "Unpin" : "Pin"}
																</Menu.Item>
																<Menu.Item
																	leftSection={<Icon path={mdiContentDuplicate} />}
																	onClick={(e) => handleDuplicate(e, item.id)}
																>
																	Duplicate
																</Menu.Item>
																<Menu.Item
																	leftSection={<Icon path={mdiClose} />}
																	onClick={(e) => handleDelete(e, item.id)}
																>
																	Delete
																</Menu.Item>
															</Menu.Dropdown>
														</Menu>
													}
												>
													<Text
														maw={150}
														style={{
															overflow: "hidden",
															textOverflow: "ellipsis",
															whiteSpace: "nowrap",
														}}>
														{item.name}
													</Text>
												</Button>
											);
										}}
									</Sortable>
								</Stack>
							</ScrollArea>

							<Divider color={isLight ? "light.0" : "dark.4"} my="xs" />

							<Button
								w={264}
								px={12}
								color="light"
								variant="subtle"
								className={classes.entryButton}
								leftSection={<Icon path={mdiPlus} />}
								onClick={createSession}
							>
								Add session
							</Button>
						</Box>
					</SimpleGrid>
				</Popover.Dropdown>
			</Popover>

			<Environments
				opened={manageEnvs}
				onClose={closeEnvManager}
			/>
		</>
	);
}
