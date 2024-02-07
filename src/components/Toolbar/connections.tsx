import { ActionIcon, Box, Button, Group, Popover, Stack, Text, TextInput } from "@mantine/core";
import { mdiChevronDown, mdiCircle, mdiDotsVertical, mdiMagnify, mdiPlus } from "@mdi/js";
import { useMemo, useState } from "react";
import { useConnection, useConnections } from "~/hooks/connection";
import { Icon } from "../Icon";
import { useDatabaseStore } from "~/stores/database";
import { useStable } from "~/hooks/stable";
import { surrealIcon } from "~/util/icons";
import { Spacer } from "../Spacer";
import { useInterfaceStore } from "~/stores/interface";
import { useConfigStore } from "~/stores/config";
import { SANDBOX } from "~/constants";
import { closeConnection, openConnection } from "~/database";
import { useInputState } from "@mantine/hooks";

export function Connections() {
	const { openConnectionCreator } = useInterfaceStore.getState();
	const { setActiveConnection } = useConfigStore.getState();

	const [search, setSearch] = useInputState("");
	const [isOpen, setIsOpen] = useState(false);
	const connections = useConnections();
	const connection = useConnection();

	const isConnected = useDatabaseStore((s) => s.isConnected);
	const isConnecting = useDatabaseStore((s) => s.isConnecting);
	const autoConnect = useConfigStore((s) => s.autoConnect);

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
		closeConnection();

		if (autoConnect) {
			openConnection();
		}
	});

	const filtered = useMemo(() => {
		const needle = search.trim().toLocaleLowerCase();

		return connections.filter((con) =>
			con.name.toLowerCase().includes(needle)
			|| con.connection.endpoint.toLowerCase().includes(needle)
		);
	}, [connection, search]);

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
						variant="light"
						color="slate"
						onClick={toggleDropdown}
						rightSection={
							<Icon
								path={mdiCircle}
								size={0.65}
								ml={4}
								color={isConnected ? "green" : isConnecting ? "orange" : "red"}
							/>
						}
					>
						{connection.name}
					</Button>
				) : (
					<Button
						variant="light"
						color="slate"
						onClick={toggleDropdown}
						rightSection={
							<Icon path={mdiChevronDown} />
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
						autoFocus
						leftSection={
							<Icon path={mdiMagnify} />
						}
					/>

					{!search && (
						<Button
							variant="light"
							radius="md"
							color={isSandbox ? "surreal" : "slate"}
							leftSection={
								<Group gap="xs">
									<Icon path={surrealIcon} color="surreal" />
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
								mr={8}
								onClick={createNew}
							>
								<Icon path={mdiPlus} />
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
										variant="light"
										radius="md"
										color={isActive ? "surreal" : "slate"}
										leftSection={
											<Group gap="xs">
												{con.name}
											</Group>
										}
										rightSection={
											<Icon path={mdiDotsVertical} />
										}
										styles={{
											label: {
												flex: 1
											}
										}}
										onClick={() => activate(con.id)}
									/>
								);
							})}
						</Stack>
					</Box>
				</Stack>
			</Popover.Dropdown>
		</Popover>
	);
}