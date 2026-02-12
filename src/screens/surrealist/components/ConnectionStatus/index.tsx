import { Box, Button, Indicator, Loader, Menu, Text } from "@mantine/core";
import {
	Icon,
	iconClose,
	iconDownload,
	iconEdit,
	iconRefresh,
	iconRelation,
	iconReset,
	iconSandbox,
	iconUpload,
	iconWrench,
} from "@surrealdb/ui";
import { useState } from "react";
import { SANDBOX } from "~/constants";
import { useConnection, useRequireDatabase } from "~/hooks/connection";
import { useConnectionAndView } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { openConnectionDiagnosticsModal } from "~/modals/connection-diagnostics";
import { openConnectionEditModal } from "~/modals/edit-connection";
import { showNodeStatus } from "~/modals/node-status";
import { useDatabaseStore } from "~/stores/database";
import { getConnectionById } from "~/util/connection";
import { dispatchIntent } from "~/util/intents";
import { syncConnectionSchema } from "~/util/schema";
import { USER_ICONS } from "~/util/user-icons";
import { closeConnection, openConnection } from "../../connection/connection";

export function ConnectionStatus() {
	const [isDropped, setIsDropped] = useState(false);

	const [connection] = useConnectionAndView();
	const [connectionId, name, icon, _database, instance] = useConnection((c) => [
		c?.id ?? "",
		c?.name ?? "",
		c?.icon ?? 0,
		c?.lastDatabase,
		c?.instance ?? false,
	]);

	const currentState = useDatabaseStore((s) => s.currentState);
	const latestError = useDatabaseStore((s) => s.latestError);
	const remoteVersion = useDatabaseStore((s) => s.version);

	const openConnections = useStable(() => {
		dispatchIntent("open-connections");
		setIsDropped(false);
	});

	const syncSchema = useStable(() => {
		syncConnectionSchema();
	});

	const exportDatabase = useRequireDatabase(() => dispatchIntent("export-database"));
	const importDatabase = useRequireDatabase(() => dispatchIntent("import-database"));

	const openEditor = useStable(() => {
		const connection = getConnectionById(connectionId);

		if (connection) {
			openConnectionEditModal(connection);
		}
	});

	const isSandbox = connectionId === SANDBOX;
	const isManaged = isSandbox || instance;
	const isLoading = currentState === "connecting" || currentState === "retrying";
	const pulse = currentState === "connected";

	const statusInfo = {
		disconnected: ["Disconnected", "red"],
		connected: [`SurrealDB ${remoteVersion}`, "green"],
		retrying: ["Reconnecting...", ""],
		connecting: ["Connecting...", ""],
	} as const;

	const [statusText, color] = statusInfo[currentState];

	return (
		<>
			{connection && (
				<Menu
					opened={isDropped}
					onChange={setIsDropped}
					trigger="hover"
					position="bottom-start"
					transitionProps={{
						transition: "scale-y",
					}}
				>
					<Menu.Target>
						<Button
							variant="subtle"
							color="obsidian"
							onClick={openConnections}
							leftSection={
								isSandbox ? (
									<Icon path={iconSandbox} />
								) : (
									<Icon path={USER_ICONS[icon]} />
								)
							}
							rightSection={
								isLoading ? (
									<Loader
										size={14}
										ml={2}
										mr={-7}
									/>
								) : (
									<Indicator
										processing={pulse}
										color={color}
										size={9}
										ml="sm"
									/>
								)
							}
						>
							<Text
								truncate
								fw={600}
								maw={200}
								c="bright"
								ml={2}
							>
								{name}
							</Text>
						</Button>
					</Menu.Target>
					<Menu.Dropdown w={225}>
						<Box p="sm">
							<Text
								fw={600}
								c="bright"
							>
								Connection
							</Text>
							<Text
								c="obsidian"
								fz="sm"
								truncate
							>
								{statusText}
							</Text>
						</Box>

						<Menu.Divider />

						{!isSandbox && (
							<>
								<Menu.Label mt="sm">Connection</Menu.Label>
								<Menu.Item
									leftSection={<Icon path={iconReset} />}
									onClick={() => openConnection()}
								>
									Reconnect
								</Menu.Item>
								<Menu.Item
									leftSection={<Icon path={iconClose} />}
									disabled={currentState !== "connected"}
									onClick={() => closeConnection()}
								>
									Disconnect
								</Menu.Item>
								<Menu.Item
									leftSection={<Icon path={iconWrench} />}
									disabled={currentState !== "connected"}
									onClick={() => openConnectionDiagnosticsModal()}
								>
									Diagnostics
								</Menu.Item>
							</>
						)}
						<Menu.Label mt="sm">Database</Menu.Label>
						<Menu.Item
							leftSection={<Icon path={iconRefresh} />}
							disabled={currentState !== "connected"}
							onClick={syncSchema}
						>
							Sync schema
						</Menu.Item>
						<Menu.Item
							leftSection={<Icon path={iconUpload} />}
							disabled={currentState !== "connected"}
							onClick={importDatabase}
						>
							Import database
						</Menu.Item>
						<Menu.Item
							leftSection={<Icon path={iconDownload} />}
							disabled={currentState !== "connected"}
							onClick={exportDatabase}
						>
							Export database
						</Menu.Item>
						<Menu.Label mt="sm">Manage</Menu.Label>
						{!isManaged && (
							<Menu.Item
								leftSection={<Icon path={iconEdit} />}
								onClick={openEditor}
							>
								Edit connection
							</Menu.Item>
						)}
						<Menu.Item
							leftSection={<Icon path={iconRelation} />}
							disabled={currentState !== "connected"}
							onClick={() => showNodeStatus()}
						>
							View node status
						</Menu.Item>
						{latestError && (
							<>
								<Menu.Divider />
								<Menu.Label
									c="red"
									fw={700}
								>
									Connection error
								</Menu.Label>
								<Text
									px="sm"
									c="red"
									maw={350}
									style={{ overflowWrap: "break-word" }}
								>
									{latestError}
								</Text>
							</>
						)}
					</Menu.Dropdown>
				</Menu>
			)}
		</>
	);
}
