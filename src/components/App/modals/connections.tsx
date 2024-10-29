import classes from "../style.module.scss";

import {
	ActionIcon,
	Box,
	Divider,
	Flex,
	Group,
	Menu,
	Modal,
	ScrollArea,
	Stack,
	Text,
	TextInput,
	Tooltip,
} from "@mantine/core";

import {
	iconCloud,
	iconCopy,
	iconDelete,
	iconEdit,
	iconFolderPlus,
	iconHomePlus,
	iconPlus,
	iconSandbox,
	iconServer,
} from "~/util/icons";

import { useInputState } from "@mantine/hooks";
import clsx from "clsx";
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
import { useKeyNavigation } from "~/hooks/keys";
import { useStable } from "~/hooks/stable";
import { dispatchIntent, useIntent } from "~/hooks/url";
import { useConfigStore } from "~/stores/config";
import type { Connection } from "~/types";
import { Y_SLIDE_TRANSITION, fuzzyMatch, newId } from "~/util/helpers";
import { USER_ICONS } from "~/util/user-icons";

const UNGROUPED = "__ungrouped__";

export function ConnectionsModal() {
	const [isOpen, openedHandle] = useBoolean();

	const {
		setActiveConnection,
		addConnectionGroup,
		updateConnectionGroup,
		removeConnectionGroup,
	} = useConfigStore.getState();

	const [search, setSearch] = useInputState("");
	const connections = useConnections();
	const connection = useConnection();

	const groups = useConfigStore((s) => s.connectionGroups);
	const sandbox = useConfigStore((s) => s.sandbox);

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
				password,
			},
		});

		dispatchIntent("new-connection", { template });
		openedHandle.close();
	});

	const newGroup = useStable(() => {
		addConnectionGroup({
			id: newId(),
			name: `Group ${groups.length + 1}`,
		});
	});

	const isSandbox = connection?.id === SANDBOX;

	const groupsList = useMemo(() => {
		return groups.sort((a, b) => a.name.localeCompare(b.name));
	}, [groups]);

	const connectionsList = useMemo(() => {
		return connections.toSorted((a, b) => a.name.localeCompare(b.name));
	}, [connections]);

	const [grouped, flattened] = useMemo(() => {
		const filtered = connectionsList.filter((con) => {
			return fuzzyMatch(search, con.name) || fuzzyMatch(search, con.authentication.hostname);
		});

		const grouped = group(filtered, (con) => con.group ?? UNGROUPED) || {};

		return [grouped, [sandbox, ...filtered]];
	}, [connectionsList, search, sandbox]);

	const activate = useStable((con: Connection) => {
		setActiveConnection(con.id);
		openedHandle.close();
	});

	const [handleKeyDown, selected] = useKeyNavigation(flattened, activate, connection?.id);

	useKeymap([["mod+L", openedHandle.open]]);

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
			onKeyDown={handleKeyDown}
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
									border: "1px solid rgba(255, 255, 255, 0.3)",
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
									leftSection={
										<Icon
											path={iconHomePlus}
											noStroke
										/>
									}
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
				mah="calc(100vh - 200px)"
				mih={64}
			>
				<Stack
					gap="xl"
					p="lg"
				>
					<Entry
						isActive={isSandbox}
						onClick={() => activate(sandbox)}
						leftSection={<Icon path={iconSandbox} />}
						data-navigation-item-id="sandbox"
						className={clsx(selected === "sandbox" && classes.listingActive)}
					>
						<Text>Sandbox</Text>
					</Entry>

					{!grouped[UNGROUPED] && !groupsList.length && (
						<Text
							ta="center"
							py="md"
							c="slate"
							my="xl"
						>
							No connections created yet
						</Text>
					)}

					{groupsList.map((group) => (
						<ItemList
							key={group.id}
							connections={grouped[group.id] ?? []}
							active={connection?.id ?? ""}
							selected={selected}
							onClose={openedHandle.close}
							onActivate={activate}
							className={classes.connectionGroup}
							title={
								<>
									<EditableText
										value={group.name}
										onChange={(name) =>
											updateConnectionGroup({ id: group.id, name })
										}
										c="bright"
										fz="lg"
										fw={500}
									/>
									<Spacer />
									<Tooltip label="Remove group">
										<ActionIcon
											className={classes.connectionGroupRemove}
											aria-label="Remove group"
											onClick={() => removeConnectionGroup(group.id)}
											variant="subtle"
											size="sm"
										>
											<Icon
												path={iconDelete}
												size="sm"
											/>
										</ActionIcon>
									</Tooltip>
								</>
							}
						/>
					))}

					{grouped[UNGROUPED] && (
						<ItemList
							connections={grouped[UNGROUPED]}
							active={connection?.id ?? ""}
							selected={selected}
							onClose={openedHandle.close}
							onActivate={activate}
							title={
								<Text
									c="bright"
									fz="lg"
									fw={500}
								>
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

interface ItemListProps {
	title: ReactNode;
	connections: Connection[];
	active: string;
	selected: string;
	className?: string;
	onClose: () => void;
	onActivate: (connection: Connection) => void;
}

function ItemList({
	title,
	connections,
	active,
	selected,
	className,
	onClose,
	onActivate,
}: ItemListProps) {
	return (
		<Box className={className}>
			<Group mb={4}>{title}</Group>
			{connections.length === 0 ? (
				<Text
					c="slate"
					ml="sm"
					mt="sm"
				>
					No connections
				</Text>
			) : (
				<Stack
					gap={6}
					mih={10}
				>
					{connections.map((con) => (
						<Item
							key={con.id}
							connection={con}
							active={active}
							selected={selected}
							onClose={onClose}
							onActivate={onActivate}
						/>
					))}
				</Stack>
			)}
		</Box>
	);
}

interface ItemProps extends EntryProps, Omit<HTMLAttributes<HTMLButtonElement>, "style" | "color"> {
	connection: Connection;
	active: string;
	selected: string;
	onClose: () => void;
	onActivate: (connection: Connection) => void;
}

function Item({ connection, active, selected, onClose, onActivate, ...other }: ItemProps) {
	const { showContextMenu } = useContextMenu();
	const { addConnection, removeConnection } = useConfigStore.getState();
	const isActive = connection.id === active;

	const activate = useStable(() => {
		onActivate(connection);
	});

	const modify = useStable((e: MouseEvent) => {
		e.stopPropagation();
		onClose();
		dispatchIntent("edit-connection", {
			id: connection.id,
		});
	});

	return (
		<Entry
			key={connection.id}
			isActive={isActive}
			data-navigation-item-id={connection.id}
			className={clsx(
				classes.connection,
				selected === connection.id && classes.listingActive,
			)}
			onClick={activate}
			leftSection={<Icon path={USER_ICONS[connection.icon ?? 0]} />}
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
					onClick: () =>
						addConnection({
							...connection,
							lastNamespace: "",
							lastDatabase: "",
							id: newId(),
						}),
				},
				{
					key: "delete",
					title: "Delete connection",
					color: "pink.7",
					icon: <Icon path={iconDelete} />,
					onClick: () => removeConnection(connection.id),
				},
			])}
			{...other}
		>
			<Text truncate>{connection.name}</Text>
			{connection.authentication.mode === "cloud" && (
				<Flex
					opacity={isActive ? 1 : 0.5}
					ml="xs"
				>
					| Surreal Cloud
					<Icon
						path={iconCloud}
						size="sm"
						right
					/>
				</Flex>
			)}
		</Entry>
	);
}
