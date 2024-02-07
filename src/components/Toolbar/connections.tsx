import { ActionIcon, Box, Button, Group, Popover, Stack, Text, TextInput } from "@mantine/core";
import { mdiChevronDown, mdiCircle, mdiMagnify, mdiPlus } from "@mdi/js";
import { useState } from "react";
import { useConnection, useConnections } from "~/hooks/connection";
import { Icon } from "../Icon";
import { useDatabaseStore } from "~/stores/database";
import { useStable } from "~/hooks/stable";
import { surrealIcon } from "~/util/icons";
import { useIsLight } from "~/hooks/theme";
import { Spacer } from "../Spacer";
import { useInterfaceStore } from "~/stores/interface";
import { useConfigStore } from "~/stores/config";
import { SANDBOX } from "~/constants";

export function Connections() {
	const { openConnectionCreator } = useInterfaceStore.getState();
	const { setActiveConnection } = useConfigStore.getState();

	const [isOpen, setIsOpen] = useState(false);
	const connections = useConnections();
	const connection = useConnection();
	const isLight = useIsLight();

	const isConnected = useDatabaseStore((s) => s.isConnected);
	const isConnecting = useDatabaseStore((s) => s.isConnecting);

	const toggleDropdown = useStable(() => {
		setIsOpen((prev) => !prev);
	});

	const createNew = useStable(() => {
		setIsOpen(false);
		openConnectionCreator();
	});

	const openSandbox = useStable(() => {
		setIsOpen(false);
		setActiveConnection(SANDBOX);
	});

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
						autoFocus
						leftSection={
							<Icon path={mdiMagnify} />
						}
					/>

					<Button
						variant="light"
						radius="md"
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
						onClick={openSandbox}
					/>

					<Box>
						<Group>
							<Text c="slate.2">
								Connections
							</Text>
							<Spacer />
							<ActionIcon>
								<Icon path={mdiPlus} onClick={createNew} />
							</ActionIcon>
						</Group>
						<Stack gap="sm">
							{connections.length === 0 && (
								<Text c="dimmed">
									No connections configured yet
								</Text>
							)}

							{connections.map((con) => {
								const isActive = connection?.id === con.id;

								return (
									<Button
										variant="light"
										radius="md"
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