import { Button, Group, Indicator, Menu, Text } from "@mantine/core";
import { useState } from "react";
import { SANDBOX } from "~/constants";
import { useConnection } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { dispatchIntent } from "~/hooks/url";
import { useDatabaseStore } from "~/stores/database";
import type { Connection } from "~/types";
import { iconChevronDown, iconClose, iconEdit, iconList, iconReset, iconSandbox } from "~/util/icons";
import { USER_ICONS } from "~/util/user-icons";
import { Icon } from "../../../../components/Icon";
import { closeConnection, openConnection } from "../../connection/connection";

export function ConnectionStatus() {
	const [isDropped, setIsDropped] = useState(false);
	const connection = useConnection();

	const currentState = useDatabaseStore((s) => s.currentState);
	const latestError = useDatabaseStore((s) => s.latestError);
	const remoteVersion = useDatabaseStore((s) => s.version);

	const openEditor = useStable((con: Connection) => {
		dispatchIntent("edit-connection", { id: con.id });
	});

	const openConnections = useStable(() => {
		dispatchIntent("open-connections");
		setIsDropped(false);
	});

	const isSandbox = connection?.id === SANDBOX;

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
								onClick={openConnections}
								leftSection={isSandbox ? (
									<Icon path={iconSandbox} />
								) : (
									<Icon path={USER_ICONS[connection.icon ?? 0]} />
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
									ml={2}
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
								onClick={openConnections}
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
					onClick={openConnections}
					rightSection={
						<Icon path={iconChevronDown} />
					}
				>
					Select a connection
				</Button>
			)}
		</>
	);
}
