import dayjs from "dayjs";
import { AuthMode, Connection, Protocol } from "~/types";
import { Updater } from "use-immer";
import { Group, Select, TextInput, Stack, Divider, PasswordInput, Button, Modal, Paper, ActionIcon, Tooltip, Alert, SimpleGrid, Popover } from "@mantine/core";
import { CONNECTION_PROTOCOLS, AUTH_MODES, SENSITIVE_SCOPE_FIELDS } from "~/constants";
import { iconClose, iconPlus, iconWarning } from "~/util/icons";
import { EditableText } from "../EditableText";
import { Icon } from "../Icon";
import { Spacer } from "../Spacer";
import { useStable } from "~/hooks/stable";
import { useDisclosure } from "@mantine/hooks";
import { Text } from "@mantine/core";
import { ModalTitle } from "../ModalTitle";
import { useMemo } from "react";
import { fastParseJwt } from "~/util/helpers";
import { USER_ICONS } from "~/util/user-icons";

const ENDPOINT_PATTERN = /^(.+?):\/\/(.+)$/;
const SYSTEM_METHODS = new Set<AuthMode>(["root", "namespace", "database"]);
const EXPIRE_WARNING = 1000 * 60 * 60 * 3;

export interface ConnectionDetailsProps {
	value: Connection;
	onChange: Updater<Connection>;
}

export function ConnectionDetails({ value, onChange }: ConnectionDetailsProps) {
	const [editingScope, editingScopeHandle] = useDisclosure();
	const [showIcons, showIconsHandle] = useDisclosure();

	const addScopeField = useStable(() => {
		onChange((draft) => {
			draft.connection.scopeFields.push({
				subject: "",
				value: "",
			});
		});
	});

	const handleEndpointChange = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		onChange((draft) => {
			const content = e.target.value;
			const result = content.match(ENDPOINT_PATTERN);

			draft.connection.hostname = content;

			if (result === null) {
				return;
			}

			const [, protocol, hostname] = result;
			const isValid = CONNECTION_PROTOCOLS.some((p) => p.value === protocol);

			if (!isValid) {
				return;
			}

			draft.connection.protocol = protocol as Protocol;
			draft.connection.hostname = hostname;
		});
	});

	const updateIcon = (index: number) => {
		onChange((draft) => {
			draft.icon = index;
		});
	};

	const isMemory = value.connection.protocol === "mem";
	const isIndexDB = value.connection.protocol === "indxdb";

	const placeholder = isMemory
		? "Not applicable"
		: isIndexDB
			? "database_name"
			: "address:port";

	const isSystemMethod = SYSTEM_METHODS.has(value.connection.authMode);
	const tokenPayload = useMemo(() => fastParseJwt(value.connection.token), [value.connection.token]);
	const tokenExpire = tokenPayload ? tokenPayload.exp * 1000 : 0;
	const tokenExpireSoon = tokenExpire > 0 && tokenExpire - Date.now() < EXPIRE_WARNING;

	return (
		<>
			<Paper
				mb="xl"
				flex={1}
			>
				<Group>
					<Popover
						opened={showIcons}
						onClose={showIconsHandle.close}
						position="bottom-start"
					>
						<Popover.Target>
							<ActionIcon
								variant="subtle"
								onClick={showIconsHandle.toggle}
								aria-label="Customize icon"
							>
								<Icon path={USER_ICONS[value.icon ?? 0]} size="lg" />
							</ActionIcon>
						</Popover.Target>
						<Popover.Dropdown>
							<SimpleGrid cols={8} spacing={4}>
								{USER_ICONS.map((icon, i) => (
									<ActionIcon
										key={i}
										variant={value.icon === i ? "gradient" : "subtle"}
										onClick={() => updateIcon(i)}
										aria-label={`Select icon ${i + 1}`}
									>
										<Icon path={icon} />
									</ActionIcon>
								))}
							</SimpleGrid>
						</Popover.Dropdown>
					</Popover>
					<EditableText
						fz={22}
						fw={600}
						value={value.name}
						onChange={(value) =>
							onChange((draft) => {
								draft.name = value;
							})
						}
					/>
				</Group>
			</Paper>
			<Group mb="lg">
				<Select
					data={CONNECTION_PROTOCOLS}
					maw={110}
					value={value.connection.protocol}
					onChange={(value) =>
						onChange((draft) => {
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
					value={value.connection.hostname}
					disabled={isMemory}
					placeholder={placeholder}
					onChange={handleEndpointChange}
				/>
			</Group>
			<Group gap="lg" align="start">
				<Stack gap="xs" flex={1}>
					<Text fz="xl" c="slate">
						Database
					</Text>
					<TextInput
						label="Namespace"
						value={value.connection.namespace}
						onChange={(e) =>
							onChange((draft) => {
								draft.connection.namespace = e.target.value;
							})
						}
					/>
					<TextInput
						label="Database"
						value={value.connection.database}
						onChange={(e) =>
							onChange((draft) => {
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
						value={value.connection.authMode}
						data={AUTH_MODES}
						onChange={(value) =>
							onChange((draft) => {
								draft.connection.authMode = value as AuthMode;
							})
						}
					/>
					{isSystemMethod && (
						<>
							<TextInput
								label="Username"
								value={value.connection.username}
								onChange={(e) =>
									onChange((draft) => {
										draft.connection.username = e.target.value;
									})
								}
							/>
							<PasswordInput
								label="Password"
								value={value.connection.password}
								onChange={(e) =>
									onChange((draft) => {
										draft.connection.password = e.target.value;
									})
								}
							/>
						</>
					)}

					{value.connection.authMode === "scope" && (
						<>
							<TextInput
								label="Scope"
								value={value.connection.scope}
								onChange={(e) =>
									onChange((draft) => {
										draft.connection.scope = e.target.value;
									})
								}
							/>
							<Button mt={21} color="blue" variant="outline" onClick={editingScopeHandle.open}>
								Edit scope data
							</Button>
						</>
					)}

					{value.connection.authMode === "token" && (
						<>
							<TextInput
								label="Token"
								value={value.connection.token}
								onChange={(e) =>
									onChange((draft) => {
										draft.connection.token = e.target.value;
									})
								}
								styles={{
									input: {
										fontFamily: "var(--mantine-font-family-monospace)"
									}
								}}
							/>

							{value.connection.token && (tokenPayload === null ? (
								<Alert
									color="red"
									icon={<Icon path={iconWarning} />}
								>
									The provided token does not appear to be a valid JWT
								</Alert>
							) : tokenExpireSoon && (tokenExpire > Date.now() ? (
								<Text c="slate">
									<Icon path={iconWarning} c="yellow" size="sm" left />
									This token expires in {dayjs(tokenExpire).fromNow()}
								</Text>
							) : (
								<Text c="slate">
									<Icon path={iconWarning} c="red" size="sm" left />
									This token has expired
								</Text>
							)))}
						</>
					)}
				</Stack>
			</Group>

			<Modal
				opened={editingScope}
				onClose={editingScopeHandle.close}
				size={560}
				title={
					<ModalTitle>Scope data editor</ModalTitle>
				}
			>
				{value.connection.scopeFields?.length === 0 ? (
					<Text c="gray" fs="italic">
						Press "Add field" to define scope fields
					</Text>
				) : (
					<Stack>
						{value.connection.scopeFields?.map((field, i) => {
							const fieldName = field.subject.toLowerCase();
							const ValueInput = SENSITIVE_SCOPE_FIELDS.has(fieldName)
								? PasswordInput
								: TextInput;

							return (
								<Paper key={i}>
									<Group>
										<TextInput
											placeholder="Field name"
											style={{ flex: 1 }}
											value={field.subject}
											onChange={(e) =>
												onChange((draft) => {
													draft.connection.scopeFields[i].subject = e.target.value;
												})
											}
										/>
										<ValueInput
											placeholder="Value"
											style={{ flex: 1 }}
											value={field.value}
											onChange={(e) =>
												onChange((draft) => {
													draft.connection.scopeFields[i].value = e.target.value;
												})
											}
										/>
										<Tooltip label="Remove field">
											<ActionIcon
												color="pink.9"
												aria-label="Remove scope field"
												onClick={() =>
													onChange((draft) => {
														draft.connection.scopeFields.splice(i, 1);
													})
												}
											>
												<Icon path={iconClose} color="red" />
											</ActionIcon>
										</Tooltip>
									</Group>
								</Paper>
							);
						})}
					</Stack>
				)}

				<Group mt="lg">
					<Button
						color="slate"
						variant="light"
						onClick={editingScopeHandle.close}
					>
						Back
					</Button>
					<Spacer />
					<Button
						rightSection={<Icon path={iconPlus} />}
						variant="light"
						color="blue"
						onClick={addScopeField}
					>
						Add field
					</Button>
				</Group>
			</Modal>
		</>
	);
}
