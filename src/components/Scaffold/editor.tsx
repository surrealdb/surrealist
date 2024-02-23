import { Modal, Group, Button, ActionIcon, Paper, PasswordInput, Select, Stack, TextInput, Text, Divider } from "@mantine/core";
import { Spacer } from "../Spacer";
import { useIsLight } from "~/hooks/theme";
import { useImmer } from "use-immer";
import { isConnectionValid } from "~/util/connection";
import { useStable } from "~/hooks/stable";
import { Form } from "../Form";
import { useLayoutEffect } from "react";
import { updateTitle } from "~/util/helpers";
import { useConnections } from "~/hooks/connection";
import { AuthMode, Connection, Protocol } from "~/types";
import { ModalTitle } from "../ModalTitle";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { createBaseConnection } from "~/util/defaults";
import { AUTH_MODES, CONNECTION_PROTOCOLS } from "~/constants";
import { Icon } from "../Icon";
import { EditableText } from "../EditableText";
import { useDisclosure } from "@mantine/hooks";
import { iconCheck, iconClose, iconDelete, iconPlus } from "~/util/icons";

const ENDPOINT_PATTERN = /^(.+?):\/\/(.+)$/;

function buildName(n: number) {
	return `New connection ${n ? n + 1 : ""}`.trim();
}

export function ConnectionEditor() {
	const isLight = useIsLight();
	const connections = useConnections();

	const { addConnection, updateConnection, setActiveConnection, removeConnection } = useConfigStore.getState();
	const { closeConnectionEditor } = useInterfaceStore.getState();

	const opened = useInterfaceStore((s) => s.showConnectionEditor);
	const editingId = useInterfaceStore((s) => s.editingConnectionId);
	const isCreating = useInterfaceStore((s) => s.isCreatingConnection);

	const [editingScope, editingScopeHandle] = useDisclosure();
	const [details, setDetails] = useImmer<Connection>(createBaseConnection());
	const isValid = details.name && isConnectionValid(details.connection);
	
	const generateName = useStable(() => {
		let tabName = "";
		let counter = 0;

		do {
			tabName = buildName(counter);
			counter++;
		} while (connections.some((con) => con.name === tabName));

		return tabName;
	});

	const saveInfo = useStable(async () => {
		closeConnectionEditor();

		if (isCreating) {
			addConnection(details);
			setActiveConnection(details.id);
		} else {
			updateConnection({
				id: editingId,
				name: details.name,
				connection: details.connection,
			});
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

	const handleHostnamePaste = useStable((e: React.ClipboardEvent<HTMLInputElement>) => {
		const content = e.clipboardData.getData('Text');
		const result = content.match(ENDPOINT_PATTERN);

		if (result === null) {
			return;
		}

		const [, protocol, hostname] = result;
		const isValid = CONNECTION_PROTOCOLS.some((p) => p.value === protocol);

		if (!isValid) {
			return;
		}

		setDetails((draft) => {
			draft.connection.protocol = protocol as Protocol;
			draft.connection.hostname = hostname;
		});

		e.preventDefault();
	});

	const deleteConnection = useStable(() => {
		removeConnection(details.id);
		closeConnectionEditor();
	});

	useLayoutEffect(() => {
		if (!details.name.trim()) {
			setDetails((draft) => {
				draft.name = generateName();
			});
		}
	}, [details.name]);

	useLayoutEffect(() => {
		if (opened) {
			const base = createBaseConnection();

			if (isCreating) {
				setDetails({
					...base,
					name: generateName(),
				});
			} else {
				const info = connections.find((con) => con.id === editingId);

				setDetails(info || base);
			}
		}
	}, [opened]);

	const isMemory = details.connection.protocol === "mem";
	const isIndexDB = details.connection.protocol === "indxdb";

	const placeholder = isMemory
		? "Not applicable"
		: isIndexDB
			? "database_name"
			: "localhost:8000";

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
				<Group mb="lg">
					<Select
						data={CONNECTION_PROTOCOLS}
						maw={110}
						value={details.connection.protocol}
						onChange={(value) =>
							setDetails((draft) => {
								const proto = value as Protocol;

								draft.connection.protocol = proto;

								if (value === "mem" || value === "indxdb") {
									draft.connection.authMode = "none";
								}
							})
						}
					/>
					<TextInput
						flex={1}
						value={details.connection.hostname}
						onPaste={handleHostnamePaste}
						disabled={isMemory}
						placeholder={placeholder}
						onChange={(e) =>
							setDetails((draft) => {
								draft.connection.hostname = e.target.value;
							})
						}
					/>
				</Group>
				<Group gap="lg" align="start">
					<Stack gap="xs" flex={1}>
						<Text fz="xl" c="slate">
							Database
						</Text>
						<TextInput
							label="Namespace"
							value={details.connection.namespace}
							onChange={(e) =>
								setDetails((draft) => {
									draft.connection.namespace = e.target.value;
								})
							}
						/>
						<TextInput
							label="Database"
							value={details.connection.database}
							onChange={(e) =>
								setDetails((draft) => {
									draft.connection.database = e.target.value;
								})
							}
						/>
					</Stack>
					<Divider orientation="vertical" />
					<Stack gap="xs" flex={1}>
						<Text fz="xl" c="slate">
							Authentication
						</Text>
						<Select
							label="Method"
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
									onChange={(e) =>
										setDetails((draft) => {
											draft.connection.username = e.target.value;
										})
									}
								/>
								<PasswordInput
									label="Password"
									value={details.connection.password}
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
				</Group>
				
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
											<Icon path={iconClose} color="red" />
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
						<Button rightSection={<Icon path={iconPlus} />} variant="light" color="blue" onClick={addScopeField}>
							Add field
						</Button>
					</Group>
				</Modal>

				<Group mt="lg">
					<Button
						color="slate"
						variant="light"
						onClick={closeConnectionEditor}
					>
						Close
					</Button>
					<Spacer />
					{!isCreating && (
						<Button
							color="red"
							onClick={deleteConnection}
							variant="light"
							leftSection={<Icon path={iconDelete} />}
						>
							Remove
						</Button>	
					)}
					<Button
						type="submit"
						variant="gradient"
						disabled={!isValid}
						rightSection={<Icon path={isCreating ? iconPlus : iconCheck} />}
					>
						{isCreating ? "Create" : "Save"}
					</Button>
				</Group>
			</Form>
		</Modal>
	);
}
