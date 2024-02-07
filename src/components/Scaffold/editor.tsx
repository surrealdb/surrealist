import { Modal, Group, Button, ActionIcon, Paper, PasswordInput, Select, SimpleGrid, Stack, TextInput, Text } from "@mantine/core";
import { Spacer } from "../Spacer";
import { useIsLight } from "~/hooks/theme";
import { useImmer } from "use-immer";
import { isConnectionValid } from "~/util/connection";
import { useStable } from "~/hooks/stable";
import { Form } from "../Form";
import { useLayoutEffect } from "react";
import { updateTitle } from "~/util/helpers";
import { useConnection, useConnections } from "~/hooks/connection";
import { AuthMode, Connection } from "~/types";
import { ModalTitle } from "../ModalTitle";
import { closeConnection, openConnection } from "~/database";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { createBaseConnection } from "~/util/defaults";
import { mdiClose, mdiPlus } from "@mdi/js";
import { AUTH_MODES } from "~/constants";
import { Icon } from "../Icon";
import { EditableText } from "../EditableText";
import { useDisclosure } from "@mantine/hooks";

function buildName(n: number) {
	return `New connection ${n ? n + 1 : ""}`.trim();
}

export function ConnectionEditor() {
	const isLight = useIsLight();
	const connections = useConnections();
	const activeConnection = useConnection();

	const { addConnection, updateConnection, setActiveConnection } = useConfigStore.getState();
	const { closeConnectionEditor } = useInterfaceStore.getState();

	const autoConnect = useConfigStore((s) => s.autoConnect);
	const opened = useInterfaceStore((s) => s.showConnectionEditor);
	const editingId = useInterfaceStore((s) => s.editingConnectionId);
	const isCreating = useInterfaceStore((s) => s.isCreatingConnection);

	const [editingScope, editingScopeHandle] = useDisclosure();
	const [details, setDetails] = useImmer<Connection>(createBaseConnection());
	const isValid = details.name && isConnectionValid(details.connection);

	const saveInfo = useStable(async () => {
		closeConnectionEditor();

		if (isCreating) {
			addConnection(details);
			setActiveConnection(details.id);

			if (autoConnect) {
				openConnection();
			}
		} else {
			updateConnection({
				id: editingId,
				name: details.name,
				connection: details.connection,
			});
	
			if (activeConnection?.id == editingId) {
				closeConnection();
		
				if (autoConnect) {
					openConnection();
				}
			}
		}

		updateTitle();
	});

	const addScopeField = useStable(() => {
		setDetails((draft) => {
			draft.connection.scopeFields.push({
				subject: "",
				value: "",
			});
		});
	});

	useLayoutEffect(() => {
		if (opened) {
			const base = createBaseConnection();

			if (isCreating) {
				let tabName = "";
				let counter = 0;

				do {
					tabName = buildName(counter);
					counter++;
				} while (connections.some((con) => con.name === tabName));

				console.log(tabName);

				setDetails({
					...base,
					name: tabName,
				});
			} else {
				const info = connections.find((con) => con.id === editingId);

				setDetails(info || base);
			}
		}
	}, [opened]);

	return (
		<Modal
			opened={opened}
			onClose={closeConnectionEditor}
			withCloseButton={false}
			trapFocus={false}
			size="lg"
		>
			<Form onSubmit={saveInfo}>
				<EditableText
					mb="md"
					fz={26}
					fw={600}
					value={details.name}
					onChange={(value) =>
						setDetails((draft) => {
							draft.name = value;
						})
					}
				/>
				<SimpleGrid cols={2} spacing="xl">
					<Stack>
						<TextInput
							label="Endpoint URL"
							value={details.connection.endpoint}
							placeholder="ws://localhost:8000"
							onChange={(e) =>
								setDetails((draft) => {
									draft.connection.endpoint = e.target.value;
								})
							}
						/>
						<TextInput
							label="Namespace"
							value={details.connection.namespace}
							placeholder="example"
							onChange={(e) =>
								setDetails((draft) => {
									draft.connection.namespace = e.target.value;
								})
							}
						/>
						<TextInput
							label="Database"
							value={details.connection.database}
							placeholder="example"
							onChange={(e) =>
								setDetails((draft) => {
									draft.connection.database = e.target.value;
								})
							}
						/>
					</Stack>
					<Stack>
						<Select
							label="Authentication mode"
							value={details.connection.authMode}
							data={AUTH_MODES}
							onChange={(value) =>
								setDetails((draft) => {
									draft.connection.authMode = value as AuthMode;
								})
							}
						/>
						{details.connection.authMode !== "scope" && details.connection.authMode !== "none" && (
							<>
								<TextInput
									label="Username"
									value={details.connection.username}
									placeholder="root"
									onChange={(e) =>
										setDetails((draft) => {
											draft.connection.username = e.target.value;
										})
									}
								/>
								<PasswordInput
									label="Password"
									value={details.connection.password}
									placeholder="root"
									onChange={(e) =>
										setDetails((draft) => {
											draft.connection.password = e.target.value;
										})
									}
								/>
							</>
						)}

						{details.connection.authMode === "scope" && (
							<>
								<TextInput
									label="Scope"
									value={details.connection.scope}
									placeholder="users"
									onChange={(e) =>
										setDetails((draft) => {
											draft.connection.scope = e.target.value;
										})
									}
								/>
								<Button mt={21} color="blue" variant="outline" onClick={editingScopeHandle.open}>
									Edit scope data
								</Button>
							</>
						)}
					</Stack>
				</SimpleGrid>
				
				<Modal
					opened={editingScope}
					onClose={editingScopeHandle.close}
					size={560}
					title={
						<ModalTitle>Editing scope data</ModalTitle>
					}
				>
					{details.connection.scopeFields?.length === 0 ? (
						<Text c="gray" fs="italic">
							No scope data defined
						</Text>
					) : (
						<Stack>
							{details.connection.scopeFields?.map((field, i) => (
								<Paper key={i}>
									<Group>
										<TextInput
											placeholder="Key"
											style={{ flex: 1 }}
											value={field.subject}
											onChange={(e) =>
												setDetails((draft) => {
													draft.connection.scopeFields[i].subject = e.target.value;
												})
											}
										/>
										<TextInput
											placeholder="Value"
											style={{ flex: 1 }}
											value={field.value}
											onChange={(e) =>
												setDetails((draft) => {
													draft.connection.scopeFields[i].value = e.target.value;
												})
											}
										/>
										<ActionIcon
											color="red"
											title="Remove field"
											onClick={() =>
												setDetails((draft) => {
													draft.connection.scopeFields.splice(i, 1);
												})
											}>
											<Icon path={mdiClose} color="red" />
										</ActionIcon>
									</Group>
								</Paper>
							))}
						</Stack>
					)}

					<Group mt="lg">
						<Button color={isLight ? "light.5" : "light.3"} variant="light" onClick={editingScopeHandle.close}>
							Back
						</Button>
						<Spacer />
						<Button rightSection={<Icon path={mdiPlus} />} variant="light" color="blue" onClick={addScopeField}>
							Add field
						</Button>
					</Group>
				</Modal>

				<Group mt="lg">
					<Button color={isLight ? "light.5" : "light.3"} variant="light" onClick={closeConnectionEditor}>
						Close
					</Button>
					<Spacer />
					<Button type="submit" disabled={!isValid}>
						Save details
					</Button>
				</Group>
			</Form>
		</Modal>
	);
}
