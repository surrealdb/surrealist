import { ActionIcon, Button, Center, Group, Menu, Modal, PasswordInput, Stack, Text, TextInput, Title } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { mdiDelete, mdiDotsVertical, mdiKeyVariant, mdiLock, mdiPlus, mdiRefresh } from "@mdi/js";
import { useEffect, useState } from "react";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { Panel } from "~/components/Panel";
import { Spacer } from "~/components/Spacer";
import { useIsConnected } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { getActiveSurreal } from "~/surreal";
import { showError } from "~/util/helpers";

export interface AccountsPaneProps {
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

	const [logins, setLogins] = useState<string[]>([]);
	const [isEditing, setIsEditing] = useState(false);
	const [editingLogin, setEditingLogin] = useState('');
	const [editingUsername, setEditingUsername] = useInputState('');
	const [editingPassword, setEditingPassword] = useInputState('');

	const fetchLogins = useStable(async () => {
		const response = await getActiveSurreal().query(`INFO FOR ${props.typeShort}`);
		const result = response[0].result;

		if (!result) {
			return [];
		}

		setLogins(Object.keys(result[props.field]));
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

			const userName = editingLogin || editingUsername;

			await getActiveSurreal().query(`DEFINE LOGIN ${userName} ON ${props.typeLong} PASSWORD "${editingPassword}"`);
			await fetchLogins();
		} catch(err: any) {
			showError('Failed to save account', err.message);
		}
	});

	const createAccount = useStable(() => {
		setIsEditing(true);
		setEditingLogin('');
		setEditingUsername('');
		setEditingPassword('');
	});
	
	const changePassword = useStable((login: string) => {
		setIsEditing(true);
		setEditingLogin(login);
		setEditingPassword('');
	});

	const removeAccount = useStable(async (login: string) => {
		await getActiveSurreal().query(`REMOVE LOGIN ${login} ON ${props.typeLong}`);
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
					<ActionIcon
						title="Add account"
						onClick={createAccount}
					>
						<Icon color="light.4" path={mdiPlus} />
					</ActionIcon>
					<ActionIcon
						title="Refresh"
						onClick={fetchLogins}
					>
						<Icon color="light.4" path={mdiRefresh} />
					</ActionIcon>
				</Group>
			}
		>
			{logins.length === 0 && (
				<Center h="100%" c="light.5">
					No {props.title.toLocaleLowerCase()} found
				</Center>
			)}

			<Stack spacing={0}>
				{logins.map((login) => (
					<Group
						key={login}
						spacing="xs"
						w="100%"
						noWrap
					>
						<Icon
							color={props.iconColor}
							path={mdiKeyVariant}
							size={0.85}
						/>

						<Text color={isLight ? 'gray.9' : 'gray.0'}>
							{login}
						</Text>
						<Spacer />
						<Menu
							position="right-start"
							shadow="sm"
							withArrow
							arrowOffset={18}
						>
							<Menu.Target>
								<Button
									size="xs"
									px={5}
									color="dark"
									variant="subtle"
								>
									<Icon path={mdiDotsVertical}/>
								</Button>
							</Menu.Target>
							<Menu.Dropdown>
								<Menu.Item
									icon={<Icon path={mdiLock} size={0.7} color="yellow.6" />}
									onClick={() => changePassword(login)}
								>
									Change password
								</Menu.Item>
								<Menu.Item
									icon={<Icon path={mdiDelete} size={0.7} color="red" />}
									onClick={() => removeAccount(login)}
								>
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
				title={
					<Title size={16} color={isLight ? 'light.6' : 'white'}>
						{editingLogin ? `Change password` : 'Create account'}
					</Title>
				}
			>
				<Form onSubmit={saveAccount}>
					<Stack>
						{!editingLogin && (
							<TextInput
								placeholder="Enter username"
								value={editingUsername}
								onChange={setEditingUsername}
								autoFocus
							/>
						)}
						<PasswordInput
							placeholder={editingLogin ? 'Enter new password' : 'Enter password'}
							value={editingPassword}
							onChange={setEditingPassword}
							autoFocus={!!editingLogin}
						/>
					</Stack>
					<Group mt="lg">
						<Button
							onClick={closeModal}
							color={isLight ? 'light.5' : 'light.3'}
							variant="light"
						>
							Close
						</Button>
						<Spacer />
						<Button
							color="surreal"
							disabled={editingLogin ? (!editingPassword) : (!editingUsername || !editingPassword)}
							type="submit"
						>
							Save
						</Button>
					</Group>
				</Form>
			</Modal>
		</Panel>
	)
}