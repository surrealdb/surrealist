import {
	Alert,
	Button,
	Checkbox,
	Group,
	Modal,
	PasswordInput,
	SegmentedControl,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";
import { Icon, iconClose, iconPlus, iconWarning } from "@surrealdb/ui";
import dayjs from "dayjs";
import { useMemo } from "react";
import { Updater } from "use-immer";
import { AUTH_MODES, SENSITIVE_ACCESS_FIELDS } from "~/constants";
import { useStable } from "~/hooks/stable";
import { AuthMode, Connection } from "~/types";
import { useOAuthFeatureEnabled } from "~/util/feature-flags";
import { fastParseJwt } from "~/util/helpers";
import { isOAuthAccessRequired } from "~/util/surreal-oauth";
import { ActionButton } from "../ActionButton";
import { PrimaryTitle } from "../PrimaryTitle";

const SYSTEM_METHODS = new Set<AuthMode>(["root", "namespace", "database"]);

function clearOAuthAuthFields(auth: Connection["authentication"]) {
	auth.token = "";
	auth.oauthRefreshToken = "";
	auth.oauthUseDefault = undefined;
	auth.oauthUseRefreshToken = undefined;
	auth.oauthAuthorizationEndpoint = "";
	auth.oauthTokenEndpoint = "";
	auth.oauthTokenExpiresAt = undefined;
	auth.oauthRefreshTokenExpiresAt = undefined;
}

function normalizeAuthModeSwitch(
	auth: Connection["authentication"],
	prevMode: AuthMode,
	nextMode: AuthMode,
) {
	if (prevMode === nextMode) {
		return;
	}

	if (prevMode === "oauth") {
		clearOAuthAuthFields(auth);
	}

	if (prevMode === "token") {
		auth.token = "";
	}

	if (SYSTEM_METHODS.has(prevMode)) {
		auth.username = "";
		auth.password = "";
	}

	if (nextMode === "oauth") {
		auth.username = "";
		auth.password = "";
		auth.accessFields = [];
	}

	if (nextMode === "token") {
		clearOAuthAuthFields(auth);
	}

	if (SYSTEM_METHODS.has(nextMode)) {
		clearOAuthAuthFields(auth);
		auth.access = "";
		auth.accessFields = [];
	}

	auth.mode = nextMode;
}

export interface ConnectionAuthDetailsProps {
	value: Connection;
	onChange: Updater<Connection>;
}

export function ConnectionAuthDetails({ value, onChange }: ConnectionAuthDetailsProps) {
	const [editingAccess, editingAccessHandle] = useDisclosure();
	const oauthEnabled = useOAuthFeatureEnabled();

	const authModes = useMemo(
		() => AUTH_MODES.filter((entry) => entry.value !== "oauth" || oauthEnabled),
		[oauthEnabled],
	);

	const { mode, token } = value.authentication;

	const isSystemMethod = SYSTEM_METHODS.has(mode);
	const showDatabase = mode === "database" || mode === "access";
	const showNamespace = showDatabase || mode === "namespace";
	const oauthAccessRequired = mode === "oauth" && isOAuthAccessRequired(value.authentication);

	const addAccessField = useStable(() => {
		onChange((draft) => {
			draft.authentication.accessFields.push({
				subject: "",
				value: "",
			});
		});
	});

	return (
		<Stack maw={750}>
			<SegmentedControl
				mb="sm"
				value={value.authentication.mode}
				data={authModes}
				onChange={(value) =>
					onChange((draft) => {
						normalizeAuthModeSwitch(
							draft.authentication,
							draft.authentication.mode,
							value as AuthMode,
						);
					})
				}
			/>

			{mode === "oauth" && !oauthEnabled && (
				<Alert
					color="orange"
					title="OAuth unavailable"
				>
					Instance OAuth is not enabled in this environment. Choose another authentication
					method or use a development build.
				</Alert>
			)}

			{isSystemMethod && (
				<SimpleGrid cols={2}>
					<TextInput
						label="Username"
						placeholder="admin"
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
						placeholder="admin"
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
							placeholder="my_namespace"
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
							placeholder="my_database"
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

			{value.authentication.mode === "access" && (
				<Group wrap="nowrap">
					<TextInput
						flex={1}
						label="Access method"
						placeholder="my_access_method"
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
						color="violet"
						variant="light"
						onClick={editingAccessHandle.open}
					>
						Edit access fields
					</Button>
				</Group>
			)}

			{value.authentication.mode === "oauth" && oauthEnabled && (
				<Stack gap="sm">
					{value.authentication.oauthUseDefault ? (
						<>
							<Text size="sm">
								Using the server&apos;s default OAuth configuration. You will be
								asked to sign in when connecting.
							</Text>
							<Button
								variant="light"
								color="violet"
								size="xs"
								w="fit-content"
								onClick={() =>
									onChange((draft) => {
										draft.authentication.oauthUseDefault = false;
										draft.authentication.oauthAuthorizationEndpoint = "";
										draft.authentication.oauthTokenEndpoint = "";
									})
								}
							>
								Specify access method manually
							</Button>
						</>
					) : (
						<>
							<Text size="sm">
								Leave the access method empty to use the server default (when
								configured). Sign-in happens when you connect.
							</Text>
							<TextInput
								label="Access method (optional)"
								placeholder="my_access_method"
								required={oauthAccessRequired}
								value={value.authentication.access}
								spellCheck={false}
								onChange={(e) =>
									onChange((draft) => {
										draft.authentication.access = e.target.value;
									})
								}
							/>
							<SimpleGrid cols={2}>
								<TextInput
									label="Namespace (optional)"
									placeholder="my_namespace"
									value={value.authentication.namespace}
									spellCheck={false}
									onChange={(e) =>
										onChange((draft) => {
											draft.authentication.namespace = e.target.value;
										})
									}
								/>
								<TextInput
									label="Database (optional)"
									placeholder="my_database"
									value={value.authentication.database}
									spellCheck={false}
									onChange={(e) =>
										onChange((draft) => {
											draft.authentication.database = e.target.value;
										})
									}
								/>
							</SimpleGrid>
							<Checkbox
								label="Use refresh tokens"
								description="Store refresh tokens from sign-in and renew the session before connect. You must sign in again after changing this. The SurrealDB access method must request them from the IdP (e.g. include offline_access in DEFINE ACCESS … SCOPES)."
								checked={value.authentication.oauthUseRefreshToken ?? false}
								onChange={(e) =>
									onChange((draft) => {
										draft.authentication.oauthUseRefreshToken =
											e.currentTarget.checked;

										if (!e.currentTarget.checked) {
											draft.authentication.oauthRefreshToken = "";
											draft.authentication.oauthRefreshTokenExpiresAt =
												undefined;
										}
									})
								}
							/>
						</>
					)}
				</Stack>
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
						(() => {
							const tokenPayload = fastParseJwt(token);
							const tokenExpire = tokenPayload ? tokenPayload.exp * 1000 : 0;
							const tokenExpireSoon =
								tokenExpire > 0 && tokenExpire - Date.now() < 1000 * 60 * 60 * 3;

							if (tokenPayload === null) {
								return (
									<Alert
										color="red"
										icon={<Icon path={iconWarning} />}
									>
										The provided token does not appear to be a valid JWT
									</Alert>
								);
							}

							if (tokenExpireSoon) {
								return tokenExpire > Date.now() ? (
									<Text c="obsidian">
										<Icon
											path={iconWarning}
											c="yellow"
											size="sm"
										/>
										This token expires in {dayjs(tokenExpire).fromNow()}
									</Text>
								) : (
									<Text c="obsidian">
										<Icon
											path={iconWarning}
											c="red"
											size="sm"
										/>
										This token has expired
									</Text>
								);
							}

							return null;
						})()}
				</>
			)}

			<Modal
				opened={editingAccess}
				onClose={editingAccessHandle.close}
				withCloseButton
				size="lg"
				title={<PrimaryTitle>Access fields</PrimaryTitle>}
				zIndex={250}
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
								<Group key={i}>
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
		</Stack>
	);
}
