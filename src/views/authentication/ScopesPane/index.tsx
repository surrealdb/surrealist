import { Badge, ScrollArea, Text, Textarea } from "@mantine/core";
import { ActionIcon, Button, Center, Group, Modal, Stack, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { mdiAccountLock, mdiKeyVariant, mdiPencil, mdiPlus } from "@mdi/js";
import { useState } from "react";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { ModalTitle } from "~/components/ModalTitle";
import { ContentPane } from "~/components/Pane";
import { Spacer } from "~/components/Spacer";
import { useIsConnected } from "~/hooks/connection";
import { useSchema } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { ScopeDefinition } from "~/types";
import { getActiveSurreal } from "~/util/surreal";
import { showError } from "~/util/helpers";
import { fetchDatabaseSchema } from "~/util/schema";

export function ScopePane() {
	const isLight = useIsLight();
	const isOnline = useIsConnected();
	const schema = useSchema();

	const [isEditing, setIsEditing] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [editingName, setEditingName] = useInputState("");
	const [editingSignin, setEditingSignin] = useInputState("");
	const [editingSignup, setEditingSignup] = useInputState("");
	const [editingSession, setEditingSession] = useInputState("");

	const scopes = (schema?.scopes || []) as ScopeDefinition[];

	const closeEditing = useStable(() => {
		setIsEditing(false);
	});

	const saveScope = useStable(async () => {
		try {
			setIsEditing(false);

			let query = `DEFINE SCOPE ${editingName}`;

			if (editingSession) {
				query += ` SESSION ${editingSession}`;
			}

			if (editingSignin) {
				query += ` SIGNIN (${editingSignin})`;
			}

			if (editingSignup) {
				query += ` SIGNUP (${editingSignup})`;
			}

			await getActiveSurreal().query(query);
			await fetchDatabaseSchema();
		} catch (err: any) {
			showError("Failed to save scope", err.message);
		}
	});

	const createAccount = useStable(() => {
		setIsEditing(true);
		setIsCreating(true);
		setEditingName("");
		setEditingSession("");
		setEditingSignin("");
		setEditingSignup("");
	});

	const editScope = useStable((scope: ScopeDefinition) => {
		setIsEditing(true);
		setIsCreating(false);
		setEditingName(scope.name);
		setEditingSession(scope.session || "");
		setEditingSignin(scope.signin || "");
		setEditingSignup(scope.signup || "");
	});

	const removeScope = useStable(async () => {
		await getActiveSurreal().query(`REMOVE SCOPE ${editingName}`);
		await fetchDatabaseSchema();

		closeModal();
	});

	const closeModal = useStable(() => {
		setIsEditing(false);
	});

	return (
		<ContentPane
			icon={mdiAccountLock}
			title="Database Scopes"
			rightSection={
				<Group wrap="nowrap">
					<ActionIcon title="Add account" onClick={createAccount}>
						<Icon path={mdiPlus} />
					</ActionIcon>
				</Group>
			}>
			{scopes.length === 0 && (
				<Center h="100%" c="light.5">
					{isOnline ? "No scopes found" : "Not connected"}
				</Center>
			)}

			<ScrollArea
				style={{ position: "absolute", inset: 12, paddingRight: 8, top: 0 }}
			>
				<Stack gap={0}>
					{scopes.map((scope) => (
						<Group key={scope.name} gap="xs" w="100%" wrap="nowrap">
							<Icon
								color="violet.4"
								path={mdiKeyVariant}
							/>

							<Text c={isLight ? "gray.9" : "gray.0"}>
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
							<ActionIcon
								title="Edit user"
								onClick={() => editScope(scope)}
							>
								<Icon path={mdiPencil} />
							</ActionIcon>
							{/* <Menu position="right-start" shadow="sm" withArrow arrowOffset={18}>
								<Menu.Target>
									<Button size="xs" px={5} color="dark" variant="subtle">
										<Icon path={mdiDotsVertical} />
									</Button>
								</Menu.Target>
								<Menu.Dropdown>
									<Menu.Item
										onClick={() => editScope(scope)}
										leftSection={
											<Icon path={mdiWrench} />
										}
									>
										Edit
									</Menu.Item>
									<Menu.Item
										onClick={() => removeScope(scope.name)}
										leftSection={
											<Icon path={mdiDelete} color="red" />
										}
									>
										Remove
									</Menu.Item>
								</Menu.Dropdown>
							</Menu> */}
						</Group>
					))}
				</Stack>
			</ScrollArea>

			<Modal
				size="md"
				opened={isEditing}
				onClose={closeEditing}
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
						<Textarea
							label="Sign in query"
							placeholder="e.g. SELECT * FROM user ..."
							value={editingSignin}
							onChange={setEditingSignin}
							minRows={4}
							styles={{
								input: {
									fontFamily: "JetBrains Mono",
								},
							}}
						/>
						<Textarea
							label="Sign up query"
							placeholder="e.g. CREATE USER ..."
							value={editingSignup}
							onChange={setEditingSignup}
							minRows={4}
							styles={{
								input: {
									fontFamily: "JetBrains Mono",
								},
							}}
						/>
						<TextInput
							label="Session duration"
							placeholder="e.g. 12h"
							value={editingSession}
							onChange={setEditingSession}
						/>
					</Stack>
					<Group mt="lg">
						<Button onClick={closeModal} color={isLight ? "light.5" : "light.3"} variant="light">
							Close
						</Button>
						<Spacer />
						{!isCreating && (
							<Button
								color="red"
								onClick={removeScope}
								variant="light"
							>
								Remove
							</Button>	
						)}
						<Button color="surreal" disabled={!editingName} type="submit">
							Save
						</Button>
					</Group>
				</Form>
			</Modal>
		</ContentPane>
	);
}
