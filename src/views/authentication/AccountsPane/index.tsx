import {
	ActionIcon,
	Button,
	Center,
	Group,
	Menu,
	Modal,
	MultiSelect,
	NativeSelect,
	PasswordInput,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { mdiDelete, mdiDotsVertical, mdiKeyVariant, mdiLock, mdiPlus, mdiRefresh } from "@mdi/js";
import { useEffect, useState } from "react";
import { adapter } from "~/adapter";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { Panel } from "~/components/Panel";
import { Spacer } from "~/components/Spacer";
import { useIsConnected } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { showError } from "~/util/helpers";

const roles = [
	{ value: "OWNER", label: "Owner" },
	{ value: "EDITOR", label: "Editor" },
	{ value: "VIEWER", label: "Viewer" },
];

interface SystemUser {
	username: string;
	roles: string[];
}

export interface AccountsPaneProps {
	isOnline: boolean;
	icon: string;
	title: string;
	iconColor: string;
	typeShort: string;
	typeLong: string;
	field: string;
}

export function AccountsPane(props: AccountsPaneProps) {
	const isLight = useIsLight();
	const isOnline = useIsConnected();

	const [users, setUsers] = useState<SystemUser[]>([]);
	const [isEditing, setIsEditing] = useState(false);
	const [editingUser, setEditingUser] = useState<SystemUser | undefined>();
	const [editingUsername, setEditingUsername] = useInputState("");
	const [editingPassword, setEditingPassword] = useInputState("");
	const [editingRole, setEditingRole] = useState<string[]>([]);
	const fetchLogins = useStable(async () => {
		const response = await adapter.getActiveSurreal().query(`INFO FOR ${props.typeShort}`);
		const result = response[0].result;

		if (!result) {
			return [];
		}

		console.log(result);

		let users: SystemUser[] = [];

		for (let key of Object.keys(result.users)) {
			let roles = result.users[key].split("ROLES ")[1].split(", ");
			users.push({ username: key, roles: roles });
		}

		setUsers(users);
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

			const userName = editingUser?.username || editingUsername;
			const roles = editingUser?.roles || editingRole;

			let createUserQuery = `DEFINE USER ${userName} ON ${props.typeLong} PASSWORD "${editingPassword}"`;

			if (roles.length > 0) {
				createUserQuery += ` ROLES `;

				for (const role of editingRole) {
					createUserQuery += `${role}, `;
				}

				createUserQuery = createUserQuery.slice(0, -2);
			}

			await adapter.getActiveSurreal().query(createUserQuery);
			await fetchLogins();
		} catch (err: any) {
			showError("Failed to save account", err.message);
		}
	});

	const createAccount = useStable(() => {
		setIsEditing(true);
		setEditingUser(undefined);
		setEditingUsername("");
		setEditingPassword("");
		setEditingRole([]);
	});

	const modifyUser = useStable((user: SystemUser) => {
		setIsEditing(true);
		setEditingUser(user);
		setEditingPassword("");
		setEditingRole(user.roles);
	});

	const removeAccount = useStable(async (user: SystemUser) => {
		await adapter.getActiveSurreal().query(`REMOVE USER ${user.username} ON ${props.typeLong}`);
		await fetchLogins();
	});

	const closeModal = useStable(() => {
		setIsEditing(false);
	});

	return (
		<Panel
			icon={props.icon}
			title={props.title}
			rightSection={
				<Group noWrap>
					<ActionIcon title="Add user" onClick={createAccount}>
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
					<Group key={user.username} spacing="xs" w="100%" noWrap>
						<Icon color={props.iconColor} path={mdiKeyVariant} size={0.85} />

						<Text color={isLight ? "gray.9" : "gray.0"}>{user.username}</Text>
						<Spacer />
						<Menu position="right-start" shadow="sm" withArrow arrowOffset={18}>
							<Menu.Target>
								<Button size="xs" px={5} color="dark" variant="subtle">
									<Icon path={mdiDotsVertical} />
								</Button>
							</Menu.Target>
							<Menu.Dropdown>
								<Menu.Item icon={<Icon path={mdiLock} size={0.7} color="yellow.6" />} onClick={() => modifyUser(user)}>
									Modify User
								</Menu.Item>
								<Menu.Item icon={<Icon path={mdiDelete} size={0.7} color="red" />} onClick={() => removeAccount(user)}>
									Remove
								</Menu.Item>
							</Menu.Dropdown>
						</Menu>
					</Group>
				))}
			</Stack>

			<Modal
				opened={isEditing}
				onClose={closeSaving}
				trapFocus={false}
				title={editingUser ? "Modify Account" : "Create account"}>
				<Form onSubmit={saveAccount}>
					<Stack>
						{!editingUser && (
							<TextInput placeholder="Enter username" value={editingUsername} onChange={setEditingUsername} autoFocus />
						)}
						<PasswordInput
							placeholder={editingUser ? "Enter new password" : "Enter password"}
							value={editingPassword}
							onChange={setEditingPassword}
							autoFocus={!!editingUser}
						/>
						<MultiSelect
							data={roles}
							label="Select a role"
							description="The role of the user on this database"
							value={editingRole}
							onChange={setEditingRole}
							dropdownPosition="bottom"
							withinPortal
							withAsterisk
							clearable
						/>
					</Stack>
					<Group mt="lg">
						<Button onClick={closeModal} color={isLight ? "light.5" : "light.3"} variant="light">
							Close
						</Button>
						<Spacer />
						<Button
							color="surreal"
							disabled={
								editingUser ? !editingPassword || !editingRole : !editingUsername || !editingPassword || !editingRole
							}
							type="submit">
							Save
						</Button>
					</Group>
				</Form>
			</Modal>
		</Panel>
	);
}
