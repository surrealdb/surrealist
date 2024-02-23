import classes from "./style.module.scss";
import { ActionIcon, Box, Button, Group, Popover, Stack, Text, TextInput } from "@mantine/core";
import { useMemo, useState } from "react";
import { useConnection, useConnections } from "~/hooks/connection";
import { Icon } from "../Icon";
import { useDatabaseStore } from "~/stores/database";
import { useStable } from "~/hooks/stable";
import { iconChevronDown, iconCircle, iconEdit, iconPlus, iconSearch, iconSurreal } from "~/util/icons";
import { Spacer } from "../Spacer";
import { useInterfaceStore } from "~/stores/interface";
import { useConfigStore } from "~/stores/config";
import { SANDBOX } from "~/constants";
import { useInputState } from "@mantine/hooks";

export function Connections() {
	const { openConnectionCreator , openConnectionEditor} = useInterfaceStore.getState();
	const { setActiveConnection } = useConfigStore.getState();

	const [search, setSearch] = useInputState("");
	const [isOpen, setIsOpen] = useState(false);
	const connections = useConnections();
	const connection = useConnection();

	const isConnected = useDatabaseStore((s) => s.isConnected);
	const isConnecting = useDatabaseStore((s) => s.isConnecting);

	const toggleDropdown = useStable(() => {
		setIsOpen((prev) => !prev);
	});

	const createNew = useStable(() => {
		setIsOpen(false);
		openConnectionCreator();
	});

	const activate = useStable((id: string) => {
		setIsOpen(false);
		setActiveConnection(id);
	});

	const editConnection = useStable((id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		setIsOpen(false);
		openConnectionEditor(id);
	});

	const filtered = useMemo(() => {
		const needle = search.trim().toLocaleLowerCase();

		return connections.filter((con) =>
			con.name.toLowerCase().includes(needle)
			|| con.connection.hostname.toLowerCase().includes(needle)
		);
	}, [connections, connection, search]);

	const isSandbox = connection?.id === SANDBOX;

	return (
		<Popover
			opened={isOpen}
			onChange={setIsOpen}
			position="bottom-start"
			shadow="0 8px 25px rgba(0, 0, 0, 0.35)"
			closeOnEscape
		>
			<Popover.Target>
				{connection ? (
					<Button
						h={42}
						variant="light"
						color="slate"
						radius="lg"
						onClick={toggleDropdown}
						leftSection={isSandbox && (
							<Icon path={iconSurreal} size={1.2} noStroke />
						)}
						rightSection={
							<Icon
								path={iconCircle}
								size="lg"
								color={isConnected ? "green" : isConnecting ? "orange" : "red"}
							/>
						}
					>
						<Text truncate fw={600} maw={200}>
							{connection.name}
						</Text>
					</Button>
				) : (
					<Button
						variant="light"
						color="slate"
						onClick={toggleDropdown}
						rightSection={
							<Icon path={iconChevronDown} />
						}
					>
						Select a connection
					</Button>
				)}
			</Popover.Target>
			<Popover.Dropdown w={300}>
				<Stack>
					<TextInput
						radius="md"
						placeholder="Search..."
						value={search}
						onChange={setSearch}
						variant="unstyled"
						autoFocus
						leftSection={
							<Icon path={iconSearch} />
						}
					/>

					{!search && (
						<Button
							variant="light"
							radius="md"
							color={isSandbox ? "surreal" : "slate"}
							leftSection={
								<Group gap="xs">
									<Icon path={iconSurreal} size={1.2} noStroke />
									Sandbox
								</Group>
							}
							styles={{
								label: {
									flex: 1
								}
							}}
							onClick={() => activate(SANDBOX)}
						/>
					)}

					<Box>
						<Group mb={4}>
							<Text c="slate.2">
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
									<Button
										key={con.id}
										variant="light"
										radius="md"
										pr={6}
										color={isActive ? "surreal" : "slate"}
										className={classes.connection}
										rightSection={
											<ActionIcon
												display="flex"
												component="div"
												className={classes.connectionOptions}
												onClick={(e) => editConnection(con.id, e)}
											>
												<Icon path={iconEdit} />
											</ActionIcon>
										}
										styles={{
											label: {
												flex: 1
											}
										}}
										onClick={() => activate(con.id)}
									>
										<Text truncate>
											{con.name}
										</Text>
									</Button>
								);
							})}
						</Stack>
					</Box>
				</Stack>
			</Popover.Dropdown>
		</Popover>
	);
}