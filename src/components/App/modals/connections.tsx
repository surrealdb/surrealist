import classes from "../style.module.scss";

import { ActionIcon, Box, Divider, Flex, Group, Menu, Modal, ScrollArea, Stack, Text, TextInput, Tooltip } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useContextMenu } from "mantine-contextmenu";
import { group } from "radash";
import { type HTMLAttributes, type MouseEvent, type ReactNode, useMemo } from "react";
import { isDesktop } from "~/adapter";
import { EditableText } from "~/components/EditableText";
import { Entry, type EntryProps } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { SANDBOX } from "~/constants";
import { useBoolean } from "~/hooks/boolean";
import { useConnection, useConnections } from "~/hooks/connection";
import { useKeymap } from "~/hooks/keymap";
import { useStable } from "~/hooks/stable";
import { dispatchIntent, useIntent } from "~/hooks/url";
import { useConfigStore } from "~/stores/config";
import type { Connection } from "~/types";
import { Y_SLIDE_TRANSITION, newId } from "~/util/helpers";
import { iconCloud, iconCopy, iconDelete, iconEdit, iconFolderPlus, iconHomePlus, iconPlus, iconSandbox, iconSearch, iconServer } from "~/util/icons";
import { USER_ICONS } from "~/util/user-icons";

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

export function ConnectionsModal() {
	const [isOpen, openedHandle] = useBoolean();

	const { setActiveConnection, addConnectionGroup, updateConnectionGroup, removeConnectionGroup } = useConfigStore.getState();

	const [search, setSearch] = useInputState("");
	const connections = useConnections();
	const connection = useConnection();

	const groups = useConfigStore((s) => s.connectionGroups);

	const filtered = useMemo(() => {
		const needle = search.trim().toLocaleLowerCase();

		return connections.filter((con) =>
			con.name.toLowerCase().includes(needle)
			|| con.authentication.hostname.toLowerCase().includes(needle)
		);
	}, [connections, search]);

	const newConnection = useStable(() => {
		openedHandle.close();
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
				access: "",
				token: "",
				username,
				password
			}
		});

		dispatchIntent("new-connection", { template });
		openedHandle.close();
	});

	const newGroup = useStable(() => {
		addConnectionGroup({
			id: newId(),
			name: `Group ${groups.length + 1}`
		});
	});

	const openSandbox = useStable(() => {
		setActiveConnection(SANDBOX);
		openedHandle.close();
	});

	const isSandbox = connection?.id === SANDBOX;

	const groupsList = useMemo(() => {
		return groups.sort((a, b) => a.name.localeCompare(b.name));
	}, [groups]);

	const grouped = group(filtered, (con) => con.group ?? UNGROUPED) || {};
	const ungrouped = grouped[UNGROUPED] ?? [];

	useKeymap([
		["mod+L", openedHandle.open]
	]);

	useIntent("open-connections", ({ search }) => {
		if (search) {
			setSearch(search);
		}

		openedHandle.open();
	});

	return (
		<Modal
			opened={isOpen}
			onClose={openedHandle.close}
			transitionProps={{ transition: Y_SLIDE_TRANSITION }}
			centered={false}
			size="lg"
			classNames={{
				content: classes.listingModal,
				body: classes.listingBody,
			}}
		>
			<Box p="lg">
				<Group
					mb="xs"
					gap="xs"
					c="bright"
				>
					<Icon
						path={iconServer}
						size="sm"
					/>
					<Text>Connections</Text>
				</Group>
				<Group>
					<TextInput
						flex={1}
						placeholder="Search for connections..."
						variant="unstyled"
						className={classes.listingSearch}
						autoFocus
						value={search}
						spellCheck={false}
						onChange={setSearch}
					/>
					<Menu position="right-start">
						<Menu.Target>
							<ActionIcon
								aria-label="Add..."
								variant="gradient"
								style={{
									backgroundOrigin: "border-box",
									border: "1px solid rgba(255, 255, 255, 0.3)"
								}}
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
									leftSection={<Icon path={iconHomePlus} noStroke />}
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
				</Group>
			</Box>

			<Divider mx="lg" />

			<ScrollArea.Autosize
				scrollbars="y"
				mah={350}
				mih={64}
			>
				<Stack gap="xl" p="lg">
					<Entry
						isActive={isSandbox}
						onClick={openSandbox}
						leftSection={
							<Icon path={iconSandbox} />
						}
					>
						<Text>
							Sandbox
						</Text>
					</Entry>

					{groupsList.map((group) => (
						<ItemList
							key={group.id}
							connections={grouped[group.id] ?? []}
							active={connection?.id ?? ""}
							onClose={openedHandle.close}
							className={classes.connectionGroup}
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
											className={classes.connectionGroupRemove}
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
							onClose={openedHandle.close}
							title={
								<Text c="bright" fz="lg" fw={500}>
									Connections
								</Text>
							}
						/>
					)}
				</Stack>
			</ScrollArea.Autosize>
		</Modal>
	);
}