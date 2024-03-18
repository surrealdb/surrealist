import classes from "./style.module.scss";
import { ActionIcon, Box, Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { useMemo } from "react";
import { useConnection, useConnections } from "~/hooks/connection";
import { Icon } from "../Icon";
import { useDatabaseStore } from "~/stores/database";
import { useStable } from "~/hooks/stable";
import { iconChevronDown, iconCircle, iconCopy, iconEdit, iconPlus, iconSearch, iconServer, iconSurreal } from "~/util/icons";
import { Spacer } from "../Spacer";
import { useInterfaceStore } from "~/stores/interface";
import { useConfigStore } from "~/stores/config";
import { SANDBOX } from "~/constants";
import { useDisclosure, useInputState } from "@mantine/hooks";
import { Y_SLIDE_TRANSITION, newId, showError, updateTitle } from "~/util/helpers";
import { Entry } from "../Entry";
import { useEventSubscription } from "~/hooks/event";
import { OpenConnectionsDialog } from "~/util/global-events";
import { openConnection } from "~/database";
import { useContextMenu } from "mantine-contextmenu";

export function Connections() {
	const { openConnectionCreator , openConnectionEditor} = useInterfaceStore.getState();
	const { setActiveConnection, addConnection } = useConfigStore.getState();
	const { showContextMenu } = useContextMenu();

	const [isListing, isListingHandle] = useDisclosure();
	const [search, setSearch] = useInputState("");
	const connections = useConnections();
	const connection = useConnection();

	const isConnected = useDatabaseStore((s) => s.isConnected);
	const isConnecting = useDatabaseStore((s) => s.isConnecting);

	const createNew = useStable(() => {
		isListingHandle.close();
		openConnectionCreator();
	});

	const activate = useStable((id: string) => {
		isListingHandle.close();
		setActiveConnection(id);
		updateTitle();
	});

	const editConnection = useStable((id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		isListingHandle.close();
		openConnectionEditor(id);
	});

	const filtered = useMemo(() => {
		const needle = search.trim().toLocaleLowerCase();

		return connections.filter((con) =>
			con.name.toLowerCase().includes(needle)
			|| con.connection.hostname.toLowerCase().includes(needle)
		);
	}, [connections, connection, search]);

	const connect = useStable(() => {
		openConnection().catch(err => {
			showError({
				title: 'Connection failed',
				subtitle: err.message
			});
		});
	});

	const duplicateConnection = useStable((id: string) => {
		const con = connections.find((c) => c.id === id);

		if (con) {
			addConnection({
				...con,
				id: newId()
			});
		}
	});

	const isSandbox = connection?.id === SANDBOX;

	useEventSubscription(OpenConnectionsDialog, (search) => {
		if (search) setSearch(search);
		isListingHandle.open();
	});

	return (
		<>
			{connection ? (
				<Button.Group>
					<Button
						variant="light"
						color="slate"
						onClick={isListingHandle.toggle}
						leftSection={isSandbox && (
							<Icon path={iconSurreal} size={1.2} noStroke />
						)}
						rightSection={
							isConnected && (
								<Icon
									path={iconCircle}
									size="xl"
									mr={-4}
									color="green"
								/>
							)
						}
					>
						<Text truncate fw={600} maw={200}>
							{connection.name}
						</Text>
					</Button>
					{!isConnected && (
						<Button
							variant="gradient"
							onClick={connect}
							loading={isConnecting}
						>
							Connect
						</Button>
					)}
				</Button.Group>
			) : (
				<Button
					variant="light"
					color="slate"
					onClick={isListingHandle.toggle}
					rightSection={
						<Icon path={iconChevronDown} />
					}
				>
					Select a connection
				</Button>
			)}

			<Modal
				opened={isListing}
				onClose={isListingHandle.close}
				transitionProps={{ transition: Y_SLIDE_TRANSITION }}
				centered={false}
			>
				<Stack>
					<TextInput
						placeholder="Search..."
						value={search}
						onChange={setSearch}
						variant="outline"
						color="red"
						autoFocus
						leftSection={
							<Icon path={iconSearch} />
						}
					/>

					{!search && (
						<Entry
							isActive={isSandbox}
							leftSection={
								<Group gap="xs">
									<Icon path={iconSurreal} size={1.2} noStroke />
									Sandbox
								</Group>
							}
							onClick={() => activate(SANDBOX)}
						/>
					)}

					<Box>
						<Group mb={4}>
							<Text c="slate.2" fz="lg">
								Connections
							</Text>
							<Spacer />
							<ActionIcon
								mr={7}
								onClick={createNew}
							>
								<Icon path={iconPlus} />
							</ActionIcon>
						</Group>
						<Stack gap="sm">
							{search && filtered.length === 0 ? (
								<Text c="dimmed">
									No results found
								</Text>
							) : filtered.length === 0 && (
								<Text c="dimmed">
									No connections configured yet
								</Text>
							)}

							{filtered.map((con) => {
								const isActive = connection?.id === con.id;

								return (
									<Entry
										key={con.id}
										isActive={isActive}
										className={classes.connection}
										onClick={() => activate(con.id)}
										leftSection={
											<Icon path={iconServer} />
										}
										rightSection={
											<ActionIcon
												component="div"
												className={classes.connectionOptions}
												onClick={(e) => editConnection(con.id, e)}
											>
												<Icon path={iconEdit} />
											</ActionIcon>
										}
										onContextMenu={showContextMenu([
											{
												key: "duplicate",
												title: "Duplicate",
												icon: <Icon path={iconCopy} />,
												onClick: () => duplicateConnection(con.id),
											}
										])}
									>
										<Text truncate>
											{con.name}
										</Text>
									</Entry>
								);
							})}
						</Stack>
					</Box>
				</Stack>
			</Modal>
		</>
	);
}
