import { Badge, ScrollArea, Text, Textarea, Tooltip } from "@mantine/core";
import { ActionIcon, Button, Center, Group, Modal, Stack, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
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
import { iconAccountSecure, iconCheck, iconEdit, iconKey, iconPlus } from "~/util/icons";

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
			showError({
				title: "Failed to save scope",
				subtitle: err.message
			});
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
			icon={iconAccountSecure}
			title="Database Scopes"
			rightSection={
				<Tooltip label="New scope">
					<ActionIcon onClick={createAccount}>
						<Icon path={iconPlus} />
					</ActionIcon>
				</Tooltip>
			}>
			{scopes.length === 0 && (
				<Center h="100%" c="slate">
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
							<Tooltip label="Edit scope">
								<ActionIcon onClick={() => editScope(scope)}>
									<Icon path={iconEdit} />
								</ActionIcon>
							</Tooltip>
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
						<Button
							onClick={closeModal}
							variant="light"
							color="slate"
						>
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
