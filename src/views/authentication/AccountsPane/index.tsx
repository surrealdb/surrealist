import {
	ActionIcon,
	Badge,
	Button,
	Center,
	Group,
	Modal,
	MultiSelect,
	PasswordInput,
	Stack,
	Text,
	TextInput,
	Textarea,
	Tooltip,
} from "@mantine/core";

import { useInputState } from "@mantine/hooks";
import { mdiComment, mdiKeyVariant, mdiPencil, mdiPlus, mdiRefresh } from "@mdi/js";
import { map } from "radash";
import { useEffect, useState } from "react";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { ModalTitle } from "~/components/ModalTitle";
import { Panel } from "~/components/Panel";
import { Spacer } from "~/components/Spacer";
import { extract_user_definition } from "~/generated/surrealist-embed";
import { useIsConnected } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { getActiveSurreal } from "~/util/connection";
import { showError } from "~/util/helpers";

const ROLES = [
	{ value: "OWNER", label: "Owner" },
	{ value: "EDITOR", label: "Editor" },
	{ value: "VIEWER", label: "Viewer" },
];

interface UserInfo {
	name: string;
	comment: string;
	roles: string[];
}

export interface AccountsPaneProps {
	isOnline: boolean;
	icon: string;
	title: string;
	iconColor: string;
	typeShort: string;
	typeLong: string;
}

export function AccountsPane(props: AccountsPaneProps) {
	const isLight = useIsLight();
	const isOnline = useIsConnected();

	const [users, setUsers] = useState<UserInfo[]>([]);
	const [isEditing, setIsEditing] = useState(false);
	const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
	const [editingName, setEditingName] = useInputState("");
	const [editingPassword, setEditingPassword] = useInputState("");
	const [editingComment, setEditingComment] = useInputState("");
	const [editingRole, setEditingRole] = useState<string[]>([]);

	const fetchLogins = useStable(async () => {
		const response = await getActiveSurreal().querySingle(`INFO FOR ${props.typeShort}`);
		const result = response[0].result as { users: Record<string, string> };

		if (!result) {
			return [];
		}

		const userInfo = await map(Object.values(result.users), async (definition) => {
			const result = extract_user_definition(definition);

			return result as UserInfo;
		});

		setUsers(userInfo);
	});

	useEffect(() => {
		if (isOnline) {
			fetchLogins();
		}
	}, [isOnline]);

	const closeSaving = useStable(() => {
		setIsEditing(false);
	});

	const saveAccount = useStable(async () => {
		try {
			setIsEditing(false);

			let query = `DEFINE USER ${editingName} ON ${props.typeLong} PASSWORD "${editingPassword}"`;

			if (editingRole.length > 0) {
				query += ` ROLES ${editingRole.join(', ')}`;
			}

			if (editingComment) {
				query += ` COMMENT "${editingComment}"`;
			}

			await getActiveSurreal().query(query);
			await fetchLogins();
		} catch (err: any) {
			showError("Failed to save account", err.message);
		}
	});

	const createUser = useStable(() => {
		setIsEditing(true);
		setEditingName("");
		setEditingPassword("");
		setEditingComment("");
		setEditingRole([]);
	});

	const updateUser = useStable((user: UserInfo) => {
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

		await getActiveSurreal().query(`REMOVE USER ${currentUser.name} ON ${props.typeLong}`);
		await fetchLogins();
	});

	const formatRoles = useStable((user: UserInfo) => {
		return user.roles.map((role) => {
			const roleInfo = ROLES.find((r) => r.value === role);

			return roleInfo ? roleInfo.label : role;
		}).join(' / ');
	});

	return (
		<Panel
			icon={props.icon}
			title={props.title}
			rightSection={
				<Group noWrap>
					<ActionIcon title="Add account" onClick={createUser}>
						<Icon color="light.4" path={mdiPlus} />
					</ActionIcon>
					<ActionIcon title="Refresh" onClick={fetchLogins}>
						<Icon color="light.4" path={mdiRefresh} />
					</ActionIcon>
				</Group>
			}>
			{users.length === 0 && (
				<Center h="100%" c="light.5">
					{isOnline ? `No ${props.title.toLocaleLowerCase()} found` : "Not connected"}
				</Center>
			)}

			<Stack spacing={0}>
				{users.map((user) => (
					<Group key={user.name} spacing="xs" w="100%" noWrap>
						<Icon
							color={props.iconColor}
							path={mdiKeyVariant}
							size={12}
							style={{ flexShrink: 0 }}
						/>
						<Text color={isLight ? "gray.9" : "gray.0"}>{user.name}</Text>
						<Spacer />
						{user.comment && (
							<Tooltip
								label={
									<Text maw={250} style={{ whiteSpace: 'pre-wrap' }} lineClamp={5}>
										<b>Comment:</b> {user.comment}
									</Text>
								}
								position="bottom"
								withinPortal
							>
								<div>
									<Icon
										ml={6}
										color={isLight ? "light" : "light.3"}
										path={mdiComment}
										size={10}
										style={{ flexShrink: 0 }}
									/>
								</div>
							</Tooltip>
						)}
						<Badge color="light">
							{formatRoles(user)}
						</Badge>
						<ActionIcon
							color="light"
							title="Edit user"
							onClick={() => updateUser(user)}
						>
							<Icon path={mdiPencil} size={14} />
						</ActionIcon>
					</Group>
				))}
			</Stack>

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

						<MultiSelect
							data={ROLES}
							label="Select a role"
							description="The role of the user on this database"
							value={editingRole}
							onChange={setEditingRole}
							dropdownPosition="bottom"
							withinPortal
							withAsterisk
							clearable
						/>

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
						<Button onClick={closeModal} color={isLight ? "light.5" : "light.3"} variant="light">
							Close
						</Button>
						<Spacer />
						{currentUser && (
							<Button
								color="red"
								onClick={removeUser}
								variant="light"
							>
								Remove
							</Button>	
						)}
						<Button
							color="surreal"
							disabled={!currentUser && (!editingName || !editingPassword)}
							type="submit">
							Save
						</Button>
					</Group>
				</Form>
			</Modal>
		</Panel>
	);
}
