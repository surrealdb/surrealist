import classes from "./style.module.scss";
import { ActionIcon, Box, Button, Divider, Flex, Group, Indicator, Menu, Modal, Stack, Text, TextInput, Tooltip } from "@mantine/core";
import { HTMLAttributes, MouseEvent, ReactNode, useMemo, useState } from "react";
import { useConnection, useConnections } from "~/hooks/connection";
import { Icon } from "../../../../components/Icon";
import { useDatabaseStore } from "~/stores/database";
import { useStable } from "~/hooks/stable";
import { iconChevronDown, iconClose, iconCloud, iconCopy, iconDelete, iconEdit, iconFolderPlus, iconList, iconPlus, iconReset, iconSearch, iconSurreal } from "~/util/icons";
import { Spacer } from "../../../../components/Spacer";
import { useConfigStore } from "~/stores/config";
import { SANDBOX } from "~/constants";
import { useDisclosure, useInputState } from "@mantine/hooks";
import { Y_SLIDE_TRANSITION, newId } from "~/util/helpers";
import { Entry, EntryProps } from "../../../../components/Entry";
import { useContextMenu } from "mantine-contextmenu";
import { dispatchIntent, useIntent } from "~/hooks/url";
import { USER_ICONS } from "~/util/user-icons";
import { Connection } from "~/types";
import { EditableText } from "~/components/EditableText";
import { group } from "radash";
import { useKeymap } from "~/hooks/keymap";
import { closeConnection, openConnection } from "../../connection/connection";
import { isDesktop } from "~/adapter";
import { mdiHomePlusOutline } from "@mdi/js";

const UNGROUPED = Symbol("ungrouped");

interface ItemProps extends EntryProps, Omit<HTMLAttributes<HTMLButtonElement>, 'style' | 'color'> {
	connection: Connection;
	active: string;
	onClose: () => void;
}

function Item({
	connection,
	active,
	onClose,
	...other
}: ItemProps) {
	const { showContextMenu } = useContextMenu();
	const { setActiveConnection, addConnection, removeConnection } = useConfigStore.getState();
	const isActive = connection.id === active;

	const activate = useStable(() => {
		setActiveConnection(connection.id);
		onClose();
	});

	const modify = useStable((e: MouseEvent) => {
		e.stopPropagation();
		onClose();
		dispatchIntent("edit-connection", {
			id: connection.id
		});
	});

	return (
		<Entry
			key={connection.id}
			isActive={isActive}
			className={classes.connection}
			onClick={activate}
			leftSection={
				<Icon path={USER_ICONS[connection.icon ?? 0]} />
			}
			rightSection={
				<ActionIcon
					component="div"
					variant="transparent"
					className={classes.connectionOptions}
					onClick={modify}
					aria-label="Edit connection"
				>
					<Icon path={iconEdit} />
				</ActionIcon>
			}
			onContextMenu={showContextMenu([
				{
					key: "edit",
					title: "Edit",
					icon: <Icon path={iconEdit} />,
					onClick: modify,
				},
				{
					key: "duplicate",
					title: "Duplicate",
					icon: <Icon path={iconCopy} />,
					onClick: () => addConnection({
						...connection,
						lastNamespace: "",
						lastDatabase: "",
						id: newId()
					}),
				},
				{
					key: "delete",
					title: "Delete connection",
					color: "pink.7",
					icon: <Icon path={iconDelete} />,
					onClick: () => removeConnection(connection.id),
				}
			])}
			{...other}
		>
			<Text truncate>
				{connection.name}
			</Text>
			{connection.authentication.mode === "cloud" && (
				<Flex
					opacity={isActive ? 1 : 0.5}
					ml="xs"
				>
					| Surreal Cloud
					<Icon path={iconCloud} size="sm" right />
				</Flex>
			)}
		</Entry>
	);
}

interface ItemListProps {
	title: ReactNode;
	connections: Connection[];
	active: string;
	className?: string;
	onClose: () => void;
}

function ItemList({
	title,
	connections,
	active,
	className,
	onClose
}: ItemListProps) {
	const connectionList = useMemo(() => {
		return connections.sort((a, b) => a.name.localeCompare(b.name));
	}, [connections]);

	return (
		<Box className={className}>
			<Group mb={4}>
				{title}
			</Group>
			{connectionList.length === 0 ? (
				<Text c="slate" fz="sm" mt={-2}>
					No connections
				</Text>
			) : (
				<Stack gap={6} mih={10}>
					{connectionList.map((con) => (
						<Item
							key={con.id}
							connection={con}
							active={active}
							onClose={onClose}
						/>
					))}
				</Stack>
			)}
		</Box>
	);
}

export function ConnectionList() {
	const { setActiveConnection, addConnectionGroup, updateConnectionGroup, removeConnectionGroup } = useConfigStore.getState();

	const [isDropped, setIsDropped] = useState(false);
	const [isListing, listingHandle] = useDisclosure();
	const [search, setSearch] = useInputState("");
	const connections = useConnections();
	const connection = useConnection();

	const groups = useConfigStore((s) => s.connectionGroups);
	const currentState = useDatabaseStore((s) => s.currentState);
	const latestError = useDatabaseStore((s) => s.latestError);
	const remoteVersion = useDatabaseStore((s) => s.version);

	const filtered = useMemo(() => {
		const needle = search.trim().toLocaleLowerCase();

		return connections.filter((con) =>
			con.name.toLowerCase().includes(needle)
			|| con.authentication.hostname.toLowerCase().includes(needle)
		);
	}, [connections, search]);

	const newConnection = useStable(() => {
		listingHandle.close();
		dispatchIntent("new-connection");
	});

	const newLocalhost = useStable(() => {
		const { username, password, port } = useConfigStore.getState().settings.serving;

		const template = JSON.stringify({
			name: "Local database",
			icon: 0,
			values: {
				mode: "root",
				database: "",
				namespace: "",
				protocol: "ws",
				hostname: `localhost:${port}`,
				scope: "",
				scopeFields: [],
				token: "",
				username,
				password
			}
		});

		dispatchIntent("new-connection", { template });
		listingHandle.close();
	});

	const newGroup = useStable(() => {
		addConnectionGroup({
			id: newId(),
			name: `Group ${groups.length + 1}`
		});
	});

	const openSandbox = useStable(() => {
		setActiveConnection(SANDBOX);
		listingHandle.close();
	});

	const openEditor = useStable((con: Connection) => {
		dispatchIntent("edit-connection", { id: con.id });
	});

	const openListing = useStable(() => {
		listingHandle.open();
		setIsDropped(false);
	});

	const isSandbox = connection?.id === SANDBOX;

	useIntent("open-connections", ({ search }) => {
		if (search) {
			setSearch(search);
		}

		listingHandle.open();
	});

	useKeymap([
		["mod+L", listingHandle.open]
	]);

	const groupsList = useMemo(() => {
		return groups.sort((a, b) => a.name.localeCompare(b.name));
	}, [groups]);

	const grouped = group(filtered, (con) => con.group ?? UNGROUPED) || {};
	const ungrouped = grouped[UNGROUPED] ?? [];

	const statusInfo = {
		disconnected: ["Disconnected", "red", false],
		retrying: ["Retrying...", "red", true],
		connecting: ["Connecting...", "yellow.6", true],
		connected: [`SurrealDB ${remoteVersion}`, "green", false]
	} as const;

	const [statusText, color, pulse] = statusInfo[currentState];

	return (
		<>
			{connection ? (
				<Group gap="xs">
					<Menu
						opened={isDropped}
						onChange={setIsDropped}
						trigger="hover"
						position="bottom-start"
						transitionProps={{
							transition: "scale-y"
						}}
					>
						<Menu.Target>
							<Button
								variant="subtle"
								color="slate"
								onClick={openListing}
								leftSection={isSandbox ? (
									<Icon path={iconSurreal} size={1.2} noStroke />
								) : (
									<Icon path={USER_ICONS[connection.icon ?? 0]} size={0.85} mt={-0} />
								)}
								rightSection={
									<Indicator
										processing={pulse}
										color={color}
										size={9}
										ml="sm"
									/>
								}
							>
								<Text
									truncate
									fw={600}
									maw={200}
									c="bright"
								>
									{connection.name}
								</Text>
							</Button>
						</Menu.Target>
						<Menu.Dropdown>
							<Text
								px="sm"
								c="slate"
							>
								{statusText}
							</Text>
							<Menu.Divider />
							<Menu.Item
								leftSection={<Icon path={iconList} />}
								onClick={listingHandle.toggle}
							>
								Change connection...
							</Menu.Item>
							{!isSandbox && (
								<>
									<Menu.Item
										leftSection={<Icon path={iconEdit} />}
										onClick={() => openEditor(connection)}
									>
										Edit connection
									</Menu.Item>
									<Menu.Item
										leftSection={<Icon path={iconReset} />}
										onClick={() => openConnection()}
									>
										Reconnect
									</Menu.Item>
									{currentState === "connected" && (
										<Menu.Item
											leftSection={<Icon path={iconClose} />}
											onClick={() => closeConnection()}
										>
											Disconnect
										</Menu.Item>
									)}
									{latestError && (
										<>
											<Menu.Divider />
											<Menu.Label c="red" fw={700}>
												Connection error
											</Menu.Label>
											<Text px="sm" c="red" maw={350} style={{ overflowWrap: "break-word" }}>
												{latestError}
											</Text>
										</>
									)}
								</>
							)}
						</Menu.Dropdown>
					</Menu>
				</Group>
			) : (
				<Button
					variant="subtle"
					color="slate"
					onClick={listingHandle.toggle}
					rightSection={
						<Icon path={iconChevronDown} />
					}
				>
					Select a connection
				</Button>
			)}

			<Modal
				opened={isListing}
				onClose={listingHandle.close}
				transitionProps={{ transition: Y_SLIDE_TRANSITION }}
				centered={false}
			>
				<Stack gap="xl">
					<Box>
						<Flex gap="sm">
							<TextInput
								placeholder="Search..."
								value={search}
								spellCheck={false}
								onChange={setSearch}
								variant="unstyled"
								autoFocus
								flex={1}
								leftSection={
									<Icon path={iconSearch} />
								}
							/>
							<Menu position="right-start">
								<Menu.Target>
									<ActionIcon
										aria-label="Add..."
										size={36}
										radius="md"
									>
										<Icon path={iconPlus} />
									</ActionIcon>
								</Menu.Target>
								<Menu.Dropdown>
									<Menu.Item
										leftSection={<Icon path={iconPlus} />}
										onClick={newConnection}
									>
										New connection
									</Menu.Item>
									{isDesktop && (
										<Menu.Item
											leftSection={<Icon path={mdiHomePlusOutline} noStroke />}
											onClick={newLocalhost}
										>
											New local connection
										</Menu.Item>
									)}
									<Menu.Item
										leftSection={<Icon path={iconFolderPlus} />}
										onClick={newGroup}
									>
										New group
									</Menu.Item>
								</Menu.Dropdown>
							</Menu>
						</Flex>

						<Divider my="lg" />

						<Entry
							isActive={isSandbox}
							onClick={openSandbox}
							leftSection={
								<Icon path={iconSurreal} size={1.2} noStroke />
							}
						>
							<Text>
								Sandbox
							</Text>
						</Entry>
					</Box>

					{groupsList.map((group) => (
						<ItemList
							key={group.id}
							connections={grouped[group.id] ?? []}
							active={connection?.id ?? ""}
							onClose={listingHandle.close}
							className={classes.group}
							title={
								<>
									<EditableText
										value={group.name}
										onChange={(name) => updateConnectionGroup({ id: group.id, name })}
										c="bright"
										fz="lg"
										fw={500}
									/>
									<Spacer />
									<Tooltip
										label="Remove group"
									>
										<ActionIcon
											className={classes.groupRemove}
											aria-label="Remove group"
											onClick={() => removeConnectionGroup(group.id)}
											variant="subtle"
											size="sm"
										>
											<Icon path={iconDelete} size="sm" />
										</ActionIcon>
									</Tooltip>
								</>
							}
						/>
					))}

					{(ungrouped.length > 0 || groups.length === 0) && (
						<ItemList
							connections={ungrouped}
							active={connection?.id ?? ""}
							onClose={listingHandle.close}
							title={
								<Text c="bright" fz="lg" fw={500}>
									Connections
								</Text>
							}
						/>
					)}
				</Stack>
			</Modal>
		</>
	);
}
