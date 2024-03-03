import classes from "./style.module.scss";
import { ActionIcon, Box, Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { useMemo } from "react";
import { useConnection, useConnections } from "~/hooks/connection";
import { Icon } from "../Icon";
import { useDatabaseStore } from "~/stores/database";
import { useStable } from "~/hooks/stable";
import { iconChevronDown, iconCircle, iconEdit, iconPlus, iconSearch, iconServer, iconSurreal } from "~/util/icons";
import { Spacer } from "../Spacer";
import { useInterfaceStore } from "~/stores/interface";
import { useConfigStore } from "~/stores/config";
import { SANDBOX } from "~/constants";
import { useDisclosure, useInputState } from "@mantine/hooks";
import { updateTitle } from "~/util/helpers";
import { Entry } from "../Entry";
import { openConnection } from "~/database";

const TRANSITION = {
	in: { opacity: 1, transform: 'translateY(0)' },
	out: { opacity: 0, transform: 'translateY(-20px)' },
	common: { transformOrigin: 'top' },
	transitionProperty: 'transform, opacity',
};

export function Connections() {
	const { openConnectionCreator , openConnectionEditor} = useInterfaceStore.getState();
	const { setActiveConnection } = useConfigStore.getState();

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
		openConnection();
	});

	const isSandbox = connection?.id === SANDBOX;

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
				transitionProps={{ transition: TRANSITION }}
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
										onClick={() => activate(con.id)}
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