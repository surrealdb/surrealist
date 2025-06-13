import {
	iconClose,
	iconDownload,
	iconEdit,
	iconRefresh,
	iconRelation,
	iconReset,
	iconSandbox,
	iconTable,
	iconUpload,
} from "~/util/icons";

import {
	Box,
	Button,
	Group,
	Indicator,
	Loader,
	Menu,
	Modal,
	Select,
	Stack,
	Text,
} from "@mantine/core";
import { useState } from "react";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { SANDBOX } from "~/constants";
import { useBoolean } from "~/hooks/boolean";
import { useConnection, useRequireDatabase } from "~/hooks/connection";
import { useDatasets } from "~/hooks/dataset";
import { useConnectionAndView } from "~/hooks/routing";
import { useDatabaseSchema } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { openConnectionEditModal } from "~/modals/edit-connection";
import { showNodeStatus } from "~/modals/node-status";
import { useDatabaseStore } from "~/stores/database";
import { getConnectionById } from "~/util/connection";
import { dispatchIntent } from "~/util/intents";
import { syncConnectionSchema } from "~/util/schema";
import { USER_ICONS } from "~/util/user-icons";
import { Icon } from "../../../../components/Icon";
import { closeConnection, openConnection } from "../../connection/connection";

export function ConnectionStatus() {
	const [isDropped, setIsDropped] = useState(false);
	const schema = useDatabaseSchema();

	const [connection] = useConnectionAndView();
	const [connectionId, name, icon, database, instance] = useConnection((c) => [
		c?.id ?? "",
		c?.name ?? "",
		c?.icon ?? 0,
		c?.lastDatabase,
		c?.instance ?? false,
	]);

	const noTables = schema.tables.length === 0;
	const noFunctions = schema.functions.length === 0;
	const noUsers = schema.users.length === 0;
	const isSchemaEmpty = noTables && noFunctions && noUsers;

	const [datasets, applyDataset, isDatasetLoading] = useDatasets();
	const [showDatasets, showDatasetsHandle] = useBoolean();
	const [dataset, setDataset] = useState("");

	const currentState = useDatabaseStore((s) => s.currentState);
	const latestError = useDatabaseStore((s) => s.latestError);
	const remoteVersion = useDatabaseStore((s) => s.version);

	const openConnections = useStable(() => {
		dispatchIntent("open-connections");
		setIsDropped(false);
	});

	const _openDatasets = useStable(() => {
		showDatasetsHandle.open();
		setDataset("");
	});

	const confirmDataset = useStable(async () => {
		await applyDataset(dataset);
		showDatasetsHandle.close();
	});

	const openDatasets = useRequireDatabase(_openDatasets);
	const syncSchema = useRequireDatabase(() => syncConnectionSchema());
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
							color="slate"
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
										type="dots"
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
								c="slate"
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
							</>
						)}
						<Menu.Label mt="sm">Database</Menu.Label>
						{!isSandbox && (
							<Menu.Item
								leftSection={<Icon path={iconTable} />}
								disabled={currentState !== "connected" || !isSchemaEmpty}
								onClick={openDatasets}
							>
								Apply dataset
							</Menu.Item>
						)}
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
							onClick={exportDatabase}
						>
							Export database
						</Menu.Item>
						<Menu.Item
							leftSection={<Icon path={iconDownload} />}
							disabled={currentState !== "connected"}
							onClick={importDatabase}
						>
							Import database
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

			<Modal
				opened={showDatasets}
				onClose={showDatasetsHandle.close}
				title={
					<Group>
						<Icon
							path={iconTable}
							size="lg"
						/>
						<PrimaryTitle>Apply dataset</PrimaryTitle>
					</Group>
				}
			>
				<Stack gap="xl">
					<Text>
						You can initialize your empty database with an official dataset to provide a
						starting point for your project.
					</Text>

					<Select
						placeholder="Select a dataset"
						value={dataset}
						onChange={setDataset as any}
						data={datasets}
					/>

					<Group>
						<Button
							onClick={showDatasetsHandle.close}
							color="slate"
							variant="light"
							flex={1}
						>
							Close
						</Button>
						<Button
							type="submit"
							variant="gradient"
							flex={1}
							disabled={!dataset}
							onClick={confirmDataset}
							loading={isDatasetLoading}
						>
							Apply dataset
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
