import { Badge, PasswordInput, ScrollArea, Table, Text, Tooltip } from "@mantine/core";
import { ActionIcon, Button, Center, Group, Modal, Stack, TextInput } from "@mantine/core";
import { useDisclosure, useInputState } from "@mantine/hooks";
import { useState } from "react";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { ModalTitle } from "~/components/ModalTitle";
import { ContentPane } from "~/components/Pane";
import { Spacer } from "~/components/Spacer";
import { useActiveConnection, useIsConnected } from "~/hooks/connection";
import { useSchema } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { SchemaScope, ScopeField } from "~/types";
import { extractVariables, showError, showInfo } from "~/util/helpers";
import { syncDatabaseSchema } from "~/util/schema";
import { iconAccountPlus, iconAccountSecure, iconCheck, iconEdit, iconKey, iconPlus } from "~/util/icons";
import { useIntent } from "~/hooks/url";
import { CodeInput } from "~/components/Inputs";
import { authenticate, composeAuthentication, executeQuery, register } from "~/connection";
import { getStatementCount } from "~/util/surrealql";
import { useImmer } from "use-immer";
import { SENSITIVE_SCOPE_FIELDS } from "~/constants";

export function ScopePane() {
	const { connection } = useActiveConnection();
	const isConnected = useIsConnected();
	const schema = useSchema();

	const [isRegistring, registerHandle] = useDisclosure();
	const [registerScope, setRegisterScope] = useState("");
	const [registerFields, setRegisterFields] = useImmer<ScopeField[]>([]);
	const [isLoading, setLoading] = useState(false);

	const [isEditing, editingHandle] = useDisclosure();
	const [isCreating, setIsCreating] = useState(false);
	const [editingName, setEditingName] = useInputState("");
	const [editingSignin, setEditingSignin] = useInputState("");
	const [editingSignup, setEditingSignup] = useInputState("");
	const [editingSession, setEditingSession] = useInputState("");

	const scopes = (schema?.scopes || []) as SchemaScope[];

	const saveScope = useStable(async () => {
		try {
			editingHandle.close();

			let query = `DEFINE SCOPE ${editingName}`;

			if (editingSession) {
				query += ` SESSION ${editingSession}`;
			}

			const [openSymbol, closeSymbol] = getStatementCount(editingSignin) > 1
				? ["{", "}"]
				: ["(", ")"];

			if (editingSignin) {
				query += ` SIGNIN ${openSymbol + editingSignin + closeSymbol}`;
			}

			if (editingSignup) {
				query += ` SIGNUP ${openSymbol + editingSignup + closeSymbol}`;
			}

			await executeQuery(query);
			await syncDatabaseSchema();
		} catch (err: any) {
			showError({
				title: "Failed to save scope",
				subtitle: err.message
			});
		}
	});

	const openRegistration = useStable((scope: SchemaScope) => {
		registerHandle.open();
		setRegisterScope(scope.name);

		const fields = extractVariables(scope.signup || "").map((field) => ({
			subject: field,
			value: "",
		}));

		setRegisterFields(fields);
	});

	const createScope = useStable(() => {
		editingHandle.open();
		setIsCreating(true);
		setEditingName("");
		setEditingSession("");
		setEditingSignin("");
		setEditingSignup("");
	});

	const editScope = useStable((scope: SchemaScope) => {
		editingHandle.open();
		setIsCreating(false);
		setEditingName(scope.name);
		setEditingSession(scope.session || "");
		setEditingSignin(scope.signin || "");
		setEditingSignup(scope.signup || "");
	});

	const removeScope = useStable(async () => {
		await executeQuery(`REMOVE SCOPE ${editingName}`);
		await syncDatabaseSchema();

		editingHandle.close();
	});

	const registerUser = useStable(async () => {
		const auth = composeAuthentication(connection);
		const params = registerFields.reduce((acc, field) => {
			acc[field.subject] = field.value;
			return acc;
		}, {} as any);

		try {
			setLoading(true);

			await register({
				scope: registerScope,
				namespace: connection.namespace,
				database: connection.database,
				...params
			});

			showInfo({
				title: "User registered",
				subtitle: "The user has been successfully registered"
			});
		} catch(err: any) {
			console.warn('Failed to register user', err);

			showError({
				title: "Registration failed",
				subtitle: err.message
			});
		} finally {
			await authenticate(auth);

			setLoading(false);
			registerHandle.close();
		}
	});

	useIntent("create-scope", createScope);

	useIntent("register-user", ({ scope }) => {
		const info = schema.scopes.find((s) => s.name === scope);

		if (info) {
			openRegistration(info);
		}
	});

	return (
		<ContentPane
			icon={iconAccountSecure}
			title="Database Scopes"
			rightSection={
				<Tooltip label="New scope">
					<ActionIcon
						onClick={createScope}
						aria-label="New scope"
						disabled={!isConnected}
					>
						<Icon path={iconPlus} />
					</ActionIcon>
				</Tooltip>
			}>
			{scopes.length === 0 && (
				<Center h="100%" c="slate">
					{isConnected ? "No scopes found" : "Not connected"}
				</Center>
			)}

			<ScrollArea
				style={{ position: "absolute", inset: 10, top: 0 }}
			>
				<Stack gap={0}>
					{scopes.map((scope) => (
						<Group key={scope.name} gap="xs" w="100%" wrap="nowrap">
							<Icon
								color="violet.4"
								path={iconKey}
							/>

							<Text>
								{scope.name}
							</Text>
							<Spacer />
							<Badge color="slate">
								{scope.signin && scope.signup
									? "Signup & Signin"
									: scope.signin
										? "Signin only"
										: scope.signup
											? "Signup only"
											: "No auth"}
							</Badge>
							<Tooltip label="Register user">
								<ActionIcon
									onClick={() => openRegistration(scope)}
									variant="subtle"
									aria-label="Register user"
								>
									<Icon path={iconAccountPlus} />
								</ActionIcon>
							</Tooltip>
							<Tooltip label="Edit scope">
								<ActionIcon
									onClick={() => editScope(scope)}
									variant="subtle"
									aria-label="Edit scope"
								>
									<Icon path={iconEdit} />
								</ActionIcon>
							</Tooltip>
						</Group>
					))}
				</Stack>
			</ScrollArea>

			<Modal
				size="md"
				opened={isRegistring}
				onClose={registerHandle.close}
				trapFocus={false}
				title={
					<ModalTitle>Register user</ModalTitle>
				}
			>
				<Text>
					Please fill out the following required fields to register a new user to the scope <Text span c="bright">{registerScope}</Text>.
				</Text>

				<Form onSubmit={registerUser}>
					<Table mt="md">
						<Table.Thead>
							<Table.Tr>
								<Table.Th w="50%">Scope field</Table.Th>
								<Table.Th w="50%">Value</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{registerFields.map((field, i) => {
								const fieldName = field.subject.toLowerCase();
								const ValueInput = SENSITIVE_SCOPE_FIELDS.has(fieldName)
									? PasswordInput
									: TextInput;

								return (
									<Table.Tr key={field.subject}>
										<Table.Td c="bright">
											<Text fw={600}>
												{field.subject}
											</Text>
										</Table.Td>
										<Table.Td c="bright">
											<ValueInput
												size="xs"
												value={field.value}
												onChange={e =>
													setRegisterFields((draft) => {
														draft[i].value = e.target.value;
													})
												}
											/>
										</Table.Td>
									</Table.Tr>
								);
							})}
						</Table.Tbody>
					</Table>
					<Group mt="lg">
						<Button
							onClick={registerHandle.close}
							variant="light"
							color="slate"
						>
							Close
						</Button>
						<Spacer />
						<Button
							variant="gradient"
							type="submit"
							rightSection={<Icon path={iconAccountPlus} />}
							loading={isLoading}
						>
							Register
						</Button>
					</Group>
				</Form>
			</Modal>

			<Modal
				size="md"
				opened={isEditing}
				onClose={editingHandle.close}
				trapFocus={false}
				title={
					<ModalTitle>{isCreating ? "Create scope" : "Update scope"}</ModalTitle>
				}
			>
				<Form onSubmit={saveScope}>
					<Stack>
						{isCreating && (
							<TextInput label="Enter scope name" value={editingName} onChange={setEditingName} autoFocus required />
						)}
						<CodeInput
							label="Sign in query"
							placeholder="e.g. SELECT * FROM user ..."
							value={editingSignin}
							onChange={setEditingSignin}
							styles={{
								input: {
									fontFamily: "JetBrains Mono",
								},
							}}
						/>
						<CodeInput
							label="Sign up query"
							placeholder="e.g. CREATE USER ..."
							value={editingSignup}
							onChange={setEditingSignup}
							styles={{
								input: {
									fontFamily: "JetBrains Mono",
								},
							}}
						/>
						<CodeInput
							label="Session duration"
							placeholder="e.g. 12h"
							value={editingSession}
							onChange={setEditingSession}
						/>
					</Stack>
					<Group mt="lg">
						<Button
							onClick={editingHandle.close}
							variant="light"
							color="slate"
						>
							Close
						</Button>
						<Spacer />
						{!isCreating && (
							<Button
								color="pink.9"
								onClick={removeScope}
							>
								Remove
							</Button>
						)}
						<Button
							disabled={!editingName}
							variant="gradient"
							type="submit"
							rightSection={<Icon path={iconCheck} />}
						>
							Save
						</Button>
					</Group>
				</Form>
			</Modal>
		</ContentPane>
	);
}
