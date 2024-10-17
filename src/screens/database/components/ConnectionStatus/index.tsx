import {
	iconChevronDown,
	iconClose,
	iconDownload,
	iconEdit,
	iconList,
	iconReset,
	iconSandbox,
	iconTable,
	iconUpload,
} from "~/util/icons";

import { Button, Group, Indicator, Menu, Modal, Select, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { SANDBOX } from "~/constants";
import { useBoolean } from "~/hooks/boolean";
import { useConnection } from "~/hooks/connection";
import { useDatasets } from "~/hooks/dataset";
import { useDatabaseSchema } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { dispatchIntent } from "~/hooks/url";
import { useDatabaseStore } from "~/stores/database";
import type { Connection } from "~/types";
import { USER_ICONS } from "~/util/user-icons";
import { Icon } from "../../../../components/Icon";
import { closeConnection, openConnection } from "../../connection/connection";

export function ConnectionStatus() {
	const [isDropped, setIsDropped] = useState(false);
	const connection = useConnection();
	const schema = useDatabaseSchema();

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

	const openEditor = useStable((con: Connection) => {
		dispatchIntent("edit-connection", { id: con.id });
	});

	const openConnections = useStable(() => {
		dispatchIntent("open-connections");
		setIsDropped(false);
	});

	const openDatasets = useStable(() => {
		showDatasetsHandle.open();
		setDataset("");
	});

	const confirmDataset = useStable(async () => {
		await applyDataset(dataset);
		showDatasetsHandle.close();
	});

	const isSandbox = connection?.id === SANDBOX;

	const statusInfo = {
		disconnected: ["Disconnected", "red", false],
		retrying: ["Retrying...", "red", true],
		connecting: ["Connecting...", "yellow.6", true],
		connected: [`SurrealDB ${remoteVersion}`, "green", false],
	} as const;

	const [statusText, color, pulse] = statusInfo[currentState];

	// NOTE - Temporary
	const protocol = connection?.authentication?.protocol;
	const isExportDisabled = protocol === "indxdb" || protocol === "mem";

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
										<Icon path={USER_ICONS[connection.icon ?? 0]} />
									)
								}
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
						<Menu.Dropdown miw={175}>
							<Text
								py={2}
								px="sm"
								c="slate"
							>
								{statusText}
							</Text>
							<Menu.Divider />
							<Menu.Label>Connection</Menu.Label>
							<Menu.Item
								leftSection={<Icon path={iconList} />}
								onClick={openConnections}
							>
								Change connection
							</Menu.Item>
							{!isSandbox && (
								<Menu.Item
									leftSection={<Icon path={iconEdit} />}
									onClick={() => openEditor(connection)}
								>
									Edit connection
								</Menu.Item>
							)}
							<Menu.Label mt="sm">Actions</Menu.Label>
							{!isSandbox && connection.lastDatabase && (
								<Menu.Item
									leftSection={<Icon path={iconTable} />}
									disabled={currentState !== "connected" || !isSchemaEmpty}
									onClick={openDatasets}
								>
									Initialize using dataset
								</Menu.Item>
							)}
							<Menu.Item
								leftSection={<Icon path={iconUpload} />}
								disabled={currentState !== "connected" || isExportDisabled}
								onClick={() => dispatchIntent("export-database")}
							>
								Export database
							</Menu.Item>
							<Menu.Item
								leftSection={<Icon path={iconDownload} />}
								disabled={currentState !== "connected"}
								onClick={() => dispatchIntent("import-database")}
							>
								Import database
							</Menu.Item>
							{!isSandbox && (
								<>
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
					rightSection={<Icon path={iconChevronDown} />}
				>
					Select a connection
				</Button>
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
						<PrimaryTitle>Initialize using dataset</PrimaryTitle>
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
