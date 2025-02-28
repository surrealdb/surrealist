import classes from "../style.module.scss";
import cloudImg from "~/assets/images/cloud-icon.webp";

import {
	ActionIcon,
	Box,
	Divider,
	Group,
	Image,
	Menu,
	Modal,
	ScrollArea,
	Stack,
	Text,
	TextInput,
	ThemeIcon,
} from "@mantine/core";

import {
	iconCloud,
	iconCopy,
	iconDelete,
	iconDotsVertical,
	iconEdit,
	iconHomePlus,
	iconPlus,
	iconServer,
} from "~/util/icons";

import clsx from "clsx";
import { type MouseEvent, useMemo, useState } from "react";
import { isDesktop } from "~/adapter";
import { Entry, type EntryProps } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { useBoolean } from "~/hooks/boolean";
import { useConnectionList, useConnectionOverview } from "~/hooks/connection";
import { useKeyNavigation } from "~/hooks/keys";
import { useConnectionAndView, useConnectionNavigator, useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useConfirmation } from "~/providers/Confirmation";
import { useConfigStore } from "~/stores/config";
import type { CloudInstance, Connection } from "~/types";
import { ON_STOP_PROPAGATION, Y_SLIDE_TRANSITION, newId } from "~/util/helpers";
import { dispatchIntent } from "~/util/intents";
import { USER_ICONS } from "~/util/user-icons";
import { resolveInstanceConnection } from "~/util/connection";

export function ConnectionsModal() {
	const [isOpen, openedHandle] = useBoolean();

	const [search, setSearch] = useState("");
	const [label, setLabel] = useState("");
	const [connection] = useConnectionAndView();
	const navigateConnection = useConnectionNavigator();

	const { sandbox, isEmpty, userConnections, organizations } = useConnectionOverview({
		search,
		label,
	});

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

	const activateConnection = useStable((con: Connection) => {
		navigateConnection(con.id);
		openedHandle.close();
	});

	const activateInstance = useStable((instance: CloudInstance) => {
		activateConnection(resolveInstanceConnection(instance));
	});

	const [handleKeyDown, selected] = useKeyNavigation([], () => {}, connection || undefined);

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
						onChange={(e) => setSearch(e.target.value)}
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
						</Menu.Dropdown>
					</Menu>
				</Group>
			</Box>

			<Divider mx="lg" />

			<ScrollArea.Autosize
				scrollbars="y"
				mah="calc(100vh - 225px)"
				mih={64}
			>
				<Stack
					gap="xl"
					p="lg"
				>
					{isEmpty && (
						<Text
							c="slate"
							ta="center"
							my="xl"
						>
							No connections found
						</Text>
					)}

					{sandbox && (
						<ConnectionEntry
							connection={sandbox}
							active={connection ?? ""}
							selected={selected}
							onClose={openedHandle.close}
							onConnect={activateConnection}
						/>
					)}

					{userConnections.length > 0 && (
						<Stack gap="xs">
							<Text
								fz="xl"
								fw={500}
								c="bright"
							>
								Connections
							</Text>
							{userConnections.map((con) => (
								<ConnectionEntry
									key={con.id}
									connection={con}
									active={connection ?? ""}
									selected={selected}
									onClose={openedHandle.close}
									onConnect={activateConnection}
								/>
							))}
						</Stack>
					)}

					{organizations.map((org) => (
						<Stack
							key={org.info.id}
							gap="xs"
						>
							<Group>
								<Text
									fz="xl"
									fw={500}
									c="bright"
								>
									{org.info.name}
								</Text>
								<Image
									src={cloudImg}
									height={16}
								/>
							</Group>
							{org.instances.map((instance) => (
								<InstanceEntry
									key={instance.id}
									instance={instance}
									active={connection ?? ""}
									selected={selected}
									onClose={openedHandle.close}
									onConnect={activateInstance}
								/>
							))}
						</Stack>
					))}
				</Stack>
			</ScrollArea.Autosize>
		</Modal>
	);
}

interface ConnectionEntryProps extends EntryProps {
	connection: Connection;
	active: string;
	selected: string;
	onConnect: (connection: Connection) => void;
	onClose: () => void;
}

function ConnectionEntry({
	connection,
	active,
	selected,
	onConnect: onActivate,
	onClose,
	...other
}: ConnectionEntryProps) {
	const { addConnection, removeConnection } = useConfigStore.getState();
	const [showOptions, setShowOptions] = useState(false);

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

	const handleOptions = useStable((e: MouseEvent) => {
		e.stopPropagation();
		setShowOptions(true);
	});

	const handleDelete = useConfirmation({
		title: "Remove connection",
		message: "Are you sure you want to remove this connection?",
		skippable: true,
		onConfirm() {
			removeConnection(connection.id);
		},
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
				<Menu
					opened={showOptions}
					onChange={setShowOptions}
					transitionProps={{
						transition: "scale-y",
					}}
				>
					<Menu.Target>
						<ActionIcon
							component="div"
							variant="transparent"
							onClick={handleOptions}
							aria-label="Connection options"
						>
							<Icon path={iconDotsVertical} />
						</ActionIcon>
					</Menu.Target>
					<Menu.Dropdown onClick={ON_STOP_PROPAGATION}>
						<Menu.Item
							leftSection={<Icon path={iconEdit} />}
							onClick={modify}
						>
							Edit details
						</Menu.Item>
						<Menu.Item
							leftSection={<Icon path={iconCopy} />}
							onClick={() => {
								addConnection({
									...connection,
									lastNamespace: "",
									lastDatabase: "",
									id: newId(),
								});
							}}
						>
							Duplicate
						</Menu.Item>
						<Menu.Divider />
						<Menu.Item
							leftSection={
								<Icon
									path={iconDelete}
									c="red"
								/>
							}
							onClick={handleDelete}
							c="red"
						>
							Delete
						</Menu.Item>
					</Menu.Dropdown>
				</Menu>
			}
			{...other}
		>
			<Text truncate>{connection.name}</Text>
		</Entry>
	);
}

interface InstanceEntryProps extends EntryProps {
	instance: CloudInstance;
	active: string;
	selected: string;
	onConnect: (instance: CloudInstance) => void;
	onClose: () => void;
}

function InstanceEntry({
	instance,
	active,
	selected,
	onConnect: onActivate,
	onClose,
	...other
}: InstanceEntryProps) {
	const [showOptions, setShowOptions] = useState(false);
	const connections = useConnectionList();

	const connection = useMemo(() => {
		return connections.find((c) => c.authentication.cloudInstance === instance.id);
	}, [connections, instance.id]);

	const isActive = connection?.id === active;

	const activate = useStable(() => {
		onActivate(instance);
	});

	const modify = useStable((e: MouseEvent) => {
		e.stopPropagation();
		onClose();
		// dispatchIntent("edit-connection", {
		// 	id: connection.id,
		// });
	});

	const handleOptions = useStable((e: MouseEvent) => {
		e.stopPropagation();
		setShowOptions(true);
	});

	const handleDelete = useConfirmation({
		title: "Remove connection",
		message: "Are you sure you want to remove this connection?",
		skippable: true,
		onConfirm() {
			// removeConnection(connection.id);
		},
	});

	return (
		<Entry
			key={instance.id}
			isActive={isActive}
			data-navigation-item-id={instance.id}
			className={clsx(classes.connection, selected === null && classes.listingActive)}
			onClick={activate}
			leftSection={<Icon path={connection ? USER_ICONS[connection.icon] : iconCloud} />}
			rightSection={
				<Menu
					opened={showOptions}
					onChange={setShowOptions}
					transitionProps={{
						transition: "scale-y",
					}}
				>
					<Menu.Target>
						<ActionIcon
							component="div"
							variant="transparent"
							onClick={handleOptions}
							aria-label="Connection options"
						>
							<Icon path={iconDotsVertical} />
						</ActionIcon>
					</Menu.Target>
					<Menu.Dropdown onClick={ON_STOP_PROPAGATION}>
						<Menu.Item
							leftSection={<Icon path={iconEdit} />}
							onClick={modify}
						>
							Edit details
						</Menu.Item>
						<Menu.Divider />
						<Menu.Item
							leftSection={
								<Icon
									path={iconDelete}
									c="red"
								/>
							}
							onClick={handleDelete}
							c="red"
						>
							Delete
						</Menu.Item>
					</Menu.Dropdown>
				</Menu>
			}
			{...other}
		>
			<Text truncate>{instance.name}</Text>
		</Entry>
	);
}
