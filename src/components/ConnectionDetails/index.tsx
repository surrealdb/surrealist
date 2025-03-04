import cloudLogo from "~/assets/images/cloud-icon.svg";

import {
	ActionIcon,
	Alert,
	Box,
	Button,
	Collapse,
	Divider,
	Group,
	Image,
	Modal,
	Paper,
	PasswordInput,
	Popover,
	Select,
	SimpleGrid,
	Stack,
	TagsInput,
	TextInput,
} from "@mantine/core";

import { AUTH_MODES, CONNECTION_PROTOCOLS, SENSITIVE_ACCESS_FIELDS } from "~/constants";

import { Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import dayjs from "dayjs";
import { fork } from "radash";
import { useMemo } from "react";
import type { Updater } from "use-immer";
import { useConnectionLabels } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import type { AuthMode, Connection, Protocol } from "~/types";
import { fastParseJwt, isHostLocal } from "~/util/helpers";
import { iconClose, iconPlus, iconWarning } from "~/util/icons";
import { USER_ICONS } from "~/util/user-icons";
import { ActionButton } from "../ActionButton";
import { EditableText } from "../EditableText";
import { Icon } from "../Icon";
import { PrimaryTitle } from "../PrimaryTitle";

const ENDPOINT_PATTERN = /^(.+?):\/\/(.+)$/;
const SYSTEM_METHODS = new Set<AuthMode>(["root", "namespace", "database"]);
const EXPIRE_WARNING = 1000 * 60 * 60 * 3;

interface SubheaderProps {
	title: string;
	subtitle: string;
}

function Subheader({ title, subtitle }: SubheaderProps) {
	return (
		<Box>
			<Text
				c="bright"
				fz="lg"
				fw={500}
			>
				{title}
			</Text>
			<Text
				c="slate.3"
				fz="sm"
				mt={-2}
			>
				{subtitle}
			</Text>
		</Box>
	);
}

export interface ConnectionDetailsProps {
	value: Connection;
	onChange: Updater<Connection>;
}

export function ConnectionDetails({ value, onChange }: ConnectionDetailsProps) {
	const [editingAccess, editingAccessHandle] = useDisclosure();
	const [showIcons, showIconsHandle] = useDisclosure();
	const labels = useConnectionLabels();
	const isLight = useIsLight();

	const { hostname, protocol, mode, token } = value.authentication;

	const addAccessField = useStable(() => {
		onChange((draft) => {
			draft.authentication.accessFields.push({
				subject: "",
				value: "",
			});
		});
	});

	const handleEndpointChange = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		onChange((draft) => {
			const content = e.target.value;
			const result = content.match(ENDPOINT_PATTERN);

			draft.authentication.hostname = content;

			if (result === null) {
				return;
			}

			const [, protocol, hostname] = result;
			const isValid = CONNECTION_PROTOCOLS.some((p) => p.value === protocol);

			if (!isValid) {
				return;
			}

			draft.authentication.protocol = protocol as Protocol;
			draft.authentication.hostname = hostname;
		});
	});

	const updateIcon = (index: number) => {
		onChange((draft) => {
			draft.icon = index;
		});
	};

	const isMemory = protocol === "mem";
	const isIndexDB = protocol === "indxdb";
	const isCloud = mode === "cloud";

	const placeholder = isMemory ? "Not applicable" : isIndexDB ? "database_name" : "hostname:port";

	const isSystemMethod = SYSTEM_METHODS.has(mode);
	const showDatabase = mode === "database" || mode === "scope" || mode === "access";
	const showNamespace = showDatabase || mode === "namespace";
	const tokenPayload = useMemo(() => fastParseJwt(token), [token]);

	const protocols = useMemo(() => {
		const [remote, local] = fork(CONNECTION_PROTOCOLS, (p) => p.remote);

		if (isCloud) {
			return remote;
		}

		return [
			{
				group: "Remote",
				items: remote,
			},
			{
				group: "Local",
				items: local,
			},
		];
	}, [isCloud]);

	const tokenExpire = tokenPayload ? tokenPayload.exp * 1000 : 0;
	const tokenExpireSoon = tokenExpire > 0 && tokenExpire - Date.now() < EXPIRE_WARNING;
	const isLocalhost = isHostLocal(hostname);
	const isSecure = protocol === "https" || protocol === "wss";
	const showSslNotice = isLocalhost && isSecure;
	const insecureVariant = protocol === "wss" ? "ws" : "http";

	return (
		<>
			<Stack flex={1}>
				<Group mb="xs">
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
								<Icon
									path={USER_ICONS[value.icon ?? 0]}
									size="lg"
								/>
							</ActionIcon>
						</Popover.Target>
						<Popover.Dropdown>
							<SimpleGrid
								cols={8}
								spacing={4}
							>
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
						flex={1}
						editable
						withDecoration
						value={value.name}
						onChange={(value) =>
							onChange((draft) => {
								draft.name = value;
							})
						}
					/>
				</Group>

				{isCloud && (
					<>
						<Paper
							bg={isLight ? "slate.0" : "slate.9"}
							radius="md"
							p="lg"
						>
							<Group>
								<Image
									src={cloudLogo}
									alt="Surreal Cloud"
									w={48}
								/>
								<Box>
									<Text
										fw={600}
										c="bright"
									>
										This connection is managed by Surreal Cloud
									</Text>
									<Text mt={4}>Some details cannot be modified manually</Text>
								</Box>
							</Group>
						</Paper>

						<Divider
							mb={6}
							mt={12}
						/>
					</>
				)}

				<Subheader
					title="Connection"
					subtitle="Database address and connection protocol"
				/>

				<Group align="start">
					<Select
						data={protocols}
						maw={125}
						value={value.authentication.protocol}
						onChange={(value) =>
							onChange((draft) => {
								const proto = value as Protocol;

								draft.authentication.protocol = proto;

								if (value === "mem" || value === "indxdb") {
									draft.authentication.mode = "none";
								}
							})
						}
					/>
					<Box flex={1}>
						<TextInput
							name="hostname"
							value={value.authentication.hostname}
							disabled={isMemory || isCloud}
							placeholder={placeholder}
							onChange={handleEndpointChange}
						/>
					</Box>
				</Group>

				<Collapse in={showSslNotice}>
					<Alert
						title="SSL verification"
						color="orange"
						mt="xs"
					>
						<Text>
							If you do not have SSL configured for your local database you may need
							to use the {insecureVariant.toUpperCase()} protocol to avoid connection
							issues.
						</Text>
						<Button
							size="xs"
							mt="md"
							color={isLight ? "slate.9" : "slate.0"}
							variant="light"
							onClick={() =>
								onChange((draft) => {
									draft.authentication.protocol = insecureVariant;
								})
							}
						>
							Switch to {insecureVariant.toUpperCase()} protocol
						</Button>
					</Alert>
				</Collapse>

				<Divider
					mb={6}
					mt={12}
				/>

				{!isCloud && (
					<>
						<Subheader
							title="Authentication"
							subtitle="Database access credentials"
						/>

						<Stack gap="sm">
							<Select
								label="Method"
								value={value.authentication.mode}
								data={AUTH_MODES}
								onChange={(value) =>
									onChange((draft) => {
										draft.authentication.mode = value as AuthMode;
									})
								}
							/>

							{isSystemMethod && (
								<SimpleGrid cols={2}>
									<TextInput
										label="Username"
										value={value.authentication.username}
										spellCheck={false}
										onChange={(e) =>
											onChange((draft) => {
												draft.authentication.username = e.target.value;
											})
										}
									/>
									<PasswordInput
										label="Password"
										value={value.authentication.password}
										spellCheck={false}
										onChange={(e) =>
											onChange((draft) => {
												draft.authentication.password = e.target.value;
											})
										}
									/>
								</SimpleGrid>
							)}

							{(showNamespace || showDatabase) && (
								<SimpleGrid cols={2}>
									{showNamespace && (
										<TextInput
											label="Namespace"
											value={value.authentication.namespace}
											spellCheck={false}
											onChange={(e) =>
												onChange((draft) => {
													draft.authentication.namespace = e.target.value;
												})
											}
										/>
									)}

									{showDatabase && (
										<TextInput
											label="Database"
											value={value.authentication.database}
											spellCheck={false}
											onChange={(e) =>
												onChange((draft) => {
													draft.authentication.database = e.target.value;
												})
											}
										/>
									)}
								</SimpleGrid>
							)}

							{value.authentication.mode === "scope" && (
								<Group wrap="nowrap">
									<TextInput
										flex={1}
										label="Scope (Legacy)"
										value={value.authentication.scope}
										spellCheck={false}
										onChange={(e) =>
											onChange((draft) => {
												draft.authentication.scope = e.target.value;
											})
										}
									/>
									<Button
										mt={19}
										color="blue"
										variant="light"
										onClick={editingAccessHandle.open}
									>
										Edit scope data
									</Button>
								</Group>
							)}

							{value.authentication.mode === "access" && (
								<Group wrap="nowrap">
									<TextInput
										flex={1}
										label="Access method"
										value={value.authentication.access}
										spellCheck={false}
										onChange={(e) =>
											onChange((draft) => {
												draft.authentication.access = e.target.value;
											})
										}
									/>
									<Button
										mt={19}
										color="blue"
										variant="light"
										onClick={editingAccessHandle.open}
									>
										Edit access fields
									</Button>
								</Group>
							)}

							{value.authentication.mode === "token" && (
								<>
									<TextInput
										label="Token"
										value={value.authentication.token}
										spellCheck={false}
										onChange={(e) =>
											onChange((draft) => {
												draft.authentication.token = e.target.value;
											})
										}
										styles={{
											input: {
												fontFamily: "var(--mantine-font-family-monospace)",
											},
										}}
									/>

									{value.authentication.token &&
										(tokenPayload === null ? (
											<Alert
												color="red"
												icon={<Icon path={iconWarning} />}
											>
												The provided token does not appear to be a valid JWT
											</Alert>
										) : (
											tokenExpireSoon &&
											(tokenExpire > Date.now() ? (
												<Text c="slate">
													<Icon
														path={iconWarning}
														c="yellow"
														size="sm"
														left
													/>
													This token expires in{" "}
													{dayjs(tokenExpire).fromNow()}
												</Text>
											) : (
												<Text c="slate">
													<Icon
														path={iconWarning}
														c="red"
														size="sm"
														left
													/>
													This token has expired
												</Text>
											))
										))}
								</>
							)}
						</Stack>

						<Divider
							mb={6}
							mt={12}
						/>
					</>
				)}

				<Subheader
					title="Configuration"
					subtitle="Further connection options"
				/>

				<TagsInput
					data={labels}
					value={value.labels ?? []}
					onChange={(value) =>
						onChange((draft) => {
							draft.labels = value;
						})
					}
					label="Labels"
				/>
			</Stack>

			<Modal
				opened={editingAccess}
				onClose={editingAccessHandle.close}
				withCloseButton
				title={<PrimaryTitle>Access fields</PrimaryTitle>}
			>
				{value.authentication.accessFields?.length === 0 ? (
					<Text
						c="gray"
						fs="italic"
					>
						Press "Add field" to define access fields
					</Text>
				) : (
					<Stack>
						{value.authentication.accessFields?.map((field, i) => {
							const fieldName = field.subject.toLowerCase();
							const ValueInput = SENSITIVE_ACCESS_FIELDS.has(fieldName)
								? PasswordInput
								: TextInput;

							return (
								<Paper key={i}>
									<Group>
										<TextInput
											placeholder="Field name"
											style={{ flex: 1 }}
											value={field.subject}
											spellCheck={false}
											onChange={(e) =>
												onChange((draft) => {
													draft.authentication.accessFields[i].subject =
														e.target.value;
												})
											}
										/>
										<ValueInput
											placeholder="Value"
											style={{ flex: 1 }}
											value={field.value}
											spellCheck={false}
											onChange={(e) =>
												onChange((draft) => {
													draft.authentication.accessFields[i].value =
														e.target.value;
												})
											}
										/>
										<ActionButton
											color="pink.9"
											label="Remove field"
											onClick={() =>
												onChange((draft) => {
													draft.authentication.accessFields.splice(i, 1);
												})
											}
										>
											<Icon
												path={iconClose}
												color="red"
											/>
										</ActionButton>
									</Group>
								</Paper>
							);
						})}
					</Stack>
				)}
				<Button
					mt="xl"
					size="xs"
					fullWidth
					variant="gradient"
					rightSection={<Icon path={iconPlus} />}
					onClick={addAccessField}
				>
					Add access field
				</Button>
			</Modal>
		</>
	);
}
