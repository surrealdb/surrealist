import {
	Alert,
	Button,
	Group,
	Modal,
	Paper,
	PasswordInput,
	Select,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";

import { iconClose, iconPlus, iconWarning } from "~/util/icons";
import { Icon } from "../Icon";
import { AuthMode, Connection } from "~/types";
import { Updater } from "use-immer";
import dayjs from "dayjs";
import { AUTH_MODES, SENSITIVE_ACCESS_FIELDS } from "~/constants";
import { useMemo } from "react";
import { fastParseJwt } from "~/util/helpers";
import { useDisclosure } from "@mantine/hooks";
import { ActionButton } from "../ActionButton";
import { PrimaryTitle } from "../PrimaryTitle";
import { useStable } from "~/hooks/stable";

const SYSTEM_METHODS = new Set<AuthMode>(["root", "namespace", "database"]);
const EXPIRE_WARNING = 1000 * 60 * 60 * 3;

export interface ConnectionAuthDetailsProps {
	value: Connection;
	onChange: Updater<Connection>;
}

export function ConnectionAuthDetails({ value, onChange }: ConnectionAuthDetailsProps) {
	const [editingAccess, editingAccessHandle] = useDisclosure();

	const { mode, token } = value.authentication;

	const isSystemMethod = SYSTEM_METHODS.has(mode);
	const showDatabase = mode === "database" || mode === "scope" || mode === "access";
	const showNamespace = showDatabase || mode === "namespace";
	const tokenPayload = useMemo(() => fastParseJwt(token), [token]);
	const tokenExpire = tokenPayload ? tokenPayload.exp * 1000 : 0;
	const tokenExpireSoon = tokenExpire > 0 && tokenExpire - Date.now() < EXPIRE_WARNING;

	const addAccessField = useStable(() => {
		onChange((draft) => {
			draft.authentication.accessFields.push({
				subject: "",
				value: "",
			});
		});
	});

	return (
		<Stack>
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
						color="surreal"
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
									This token expires in {dayjs(tokenExpire).fromNow()}
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
