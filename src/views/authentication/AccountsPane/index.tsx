import {
	ActionIcon,
	Badge,
	Button,
	Center,
	Checkbox,
	Group,
	Modal,
	PasswordInput,
	ScrollArea,
	Stack,
	Text,
	TextInput,
	Textarea,
	Tooltip,
} from "@mantine/core";

import { useInputState } from "@mantine/hooks";
import { useState } from "react";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { ModalTitle } from "~/components/ModalTitle";
import { ContentPane } from "~/components/Pane";
import { Spacer } from "~/components/Spacer";
import { useIsConnected } from "~/hooks/connection";
import { useHasSchemaAccess, useSchema } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { DatabaseSchema, SchemaUser } from "~/types";
import { showError } from "~/util/helpers";
import { syncDatabaseSchema } from "~/util/schema";
import { iconCheck, iconComment, iconEdit, iconKey, iconPlus } from "~/util/icons";
import { useIntent } from "~/hooks/url";
import { executeQuery } from "~/connection";

const ROLES = [
	{ value: "OWNER", label: "Owner" },
	{ value: "EDITOR", label: "Editor" },
	{ value: "VIEWER", label: "Viewer" },
];

export interface AccountsPaneProps {
	isOnline: boolean;
	icon: string;
	title: string;
	iconColor: string;
	field: keyof DatabaseSchema;
	type: string;
}

export function AccountsPane(props: AccountsPaneProps) {
	const isConnected = useIsConnected();
	const isDenied = useHasSchemaAccess();
	const schema = useSchema();

	const [isEditing, setIsEditing] = useState(false);
	const [currentUser, setCurrentUser] = useState<SchemaUser | null>(null);
	const [editingName, setEditingName] = useInputState("");
	const [editingPassword, setEditingPassword] = useInputState("");
	const [editingComment, setEditingComment] = useInputState("");
	const [editingRole, setEditingRole] = useState<string[]>([]);

	const users = (schema?.[props.field] || []) as SchemaUser[];

	const closeSaving = useStable(() => {
		setIsEditing(false);
	});

	const saveAccount = useStable(async () => {
		try {
			setIsEditing(false);

			let query = `DEFINE USER ${editingName} ON ${props.type} PASSWORD "${editingPassword}"`;

			if (editingRole.length > 0) {
				query += ` ROLES ${editingRole.join(', ')}`;
			}

			if (editingComment) {
				query += ` COMMENT "${editingComment}"`;
			}

			await executeQuery(query);
			await syncDatabaseSchema();
		} catch (err: any) {
			showError({
				title: "Failed to save account",
				subtitle: err.message
			});
		}
	});

	const createUser = useStable(() => {
		setIsEditing(true);
		setCurrentUser(null);
		setEditingName("");
		setEditingPassword("");
		setEditingComment("");
		setEditingRole([]);
	});

	const updateUser = useStable((user: SchemaUser) => {
		setIsEditing(true);
		setCurrentUser(user);
		setEditingName(user.name);
		setEditingPassword("");
		setEditingComment(user.comment);
		setEditingRole(user.roles);
	});

	const closeModal = useStable(() => {
		setIsEditing(false);
	});

	const removeUser = useStable(async () => {
		if (!currentUser) {
			return;
		}

		closeModal();

		await executeQuery(`REMOVE USER ${currentUser.name} ON ${props.type}`);
		await syncDatabaseSchema();
	});

	const formatRoles = useStable((user: SchemaUser) => {
		return user.roles.map((role) => {
			const roleInfo = ROLES.find((r) => r.value === role);

			return roleInfo ? roleInfo.label : role;
		}).join(' / ');
	});

	useIntent("create-user", ({ level }) => {
		if (level == props.type) {
			createUser();
		}
	});

	return (
		<ContentPane
			icon={props.icon}
			title={props.title}
			rightSection={
				<Tooltip label="New user">
					<ActionIcon
						onClick={createUser}
						aria-label="Create new user"
						disabled={!isConnected}
					>
						<Icon path={iconPlus} />
					</ActionIcon>
				</Tooltip>
			}>
			{users.length === 0 && (
				<Center h="100%" c="slate">
					{isConnected
						? isDenied
							? `No ${props.title.toLocaleLowerCase()} found`
							: "No access to this information"
						: "Not connected"
					}
				</Center>
			)}

			<ScrollArea
				style={{ position: "absolute", inset: 10, top: 0 }}
			>
				<Stack gap={0}>
					{users.map((user) => (
						<Group key={user.name} gap="xs" w="100%" wrap="nowrap">
							<Icon
								color={props.iconColor}
								path={iconKey}
							/>
							<Text>
								{user.name}
							</Text>
							<Spacer />
							{user.comment && (
								<Tooltip
									label={
										<Text maw={250} style={{ whiteSpace: 'pre-wrap' }} lineClamp={5}>
											<b>Comment:</b> {user.comment}
										</Text>
									}
									position="bottom"
								>
									<div>
										<Icon
											ml={6}
											path={iconComment}
											style={{ flexShrink: 0 }}
										/>
									</div>
								</Tooltip>
							)}
							<Badge
								variant="light"
								color="slate"
							>
								{formatRoles(user)}
							</Badge>
							<Tooltip label="Edit user">
								<ActionIcon
									onClick={() => updateUser(user)}
									variant="subtle"
									aria-label="Edit user"
								>
									<Icon path={iconEdit} />
								</ActionIcon>
							</Tooltip>
						</Group>
					))}
				</Stack>
			</ScrollArea>

			<Modal
				opened={isEditing}
				onClose={closeSaving}
				trapFocus={false}
				title={
					<ModalTitle>
						{currentUser ? "Edit user" : "Create user"}
					</ModalTitle>
				}
			>
				<Form onSubmit={saveAccount}>
					<Stack>
						<TextInput
							label="Username"
							description="Must be a unique name"
							placeholder="Enter username"
							value={editingName}
							onChange={setEditingName}
							disabled={!!currentUser}
							required
							autoFocus
						/>

						<PasswordInput
							label={currentUser ? 'New password' : 'Password'}
							description={currentUser ? 'Leave blank to keep the current password' : 'The password for this user'}
							placeholder="Enter password"
							value={editingPassword}
							onChange={setEditingPassword}
							required={!currentUser}
						/>

						<Checkbox.Group
							label="Select a role"
							description="The role of the user on this database"
							value={editingRole}
							onChange={setEditingRole}
							withAsterisk
						>
							<Stack mt="xs">
								{ROLES.map((role) => (
									<Checkbox {...role} key={role.value} />
								))}
							</Stack>
						</Checkbox.Group>

						<Textarea
							label="Comment"
							description="Optional description for this user"
							placeholder="Enter comment"
							value={editingComment}
							onChange={setEditingComment}
							minRows={4}
						/>
					</Stack>
					<Group mt="lg">
						<Button
							onClick={closeModal}
							color="slate"
							variant="light"
						>
							Close
						</Button>
						<Spacer />
						{currentUser && (
							<Button
								color="pink.9"
								onClick={removeUser}
							>
								Remove
							</Button>
						)}
						<Button
							disabled={!currentUser && (!editingName || !editingPassword)}
							rightSection={<Icon path={iconCheck} />}
							variant="gradient"
							type="submit"
						>
							Save
						</Button>
					</Group>
				</Form>
			</Modal>
		</ContentPane>
	);
}
