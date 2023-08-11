import { Text, Textarea } from '@mantine/core';
import { ActionIcon, Button, Center, Group, Menu, Modal, Stack, TextInput, Title } from '@mantine/core';
import { useInputState } from '@mantine/hooks';
import { mdiAccountLock, mdiDelete, mdiDotsVertical, mdiKeyVariant, mdiPlus, mdiRefresh, mdiWrench } from '@mdi/js';
import { invoke } from '@tauri-apps/api/tauri';
import { map } from 'radash';
import { useState, useEffect } from 'react';
import { adapter } from '~/adapter';
import { Form } from '~/components/Form';
import { Icon } from '~/components/Icon';
import { Panel } from '~/components/Panel';
import { Spacer } from '~/components/Spacer';
import { useIsConnected } from '~/hooks/connection';
import { useStable } from '~/hooks/stable';
import { useIsLight } from '~/hooks/theme';
import { showError } from '~/util/helpers';

interface ScopeInfo {
	name: string;
	session: string | null;
	signin: string | null;
	signup: string | null;
}

export interface ScopePaneProps {
	isOnline: boolean;
}

export function ScopePane(props: ScopePaneProps) {
	const isLight = useIsLight();
	const isOnline = useIsConnected();

	const [scopes, setScopes] = useState<ScopeInfo[]>([]);
	const [isEditing, setIsEditing] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [editingName, setEditingName] = useInputState('');
	const [editingSignin, setEditingSignin] = useInputState('');
	const [editingSignup, setEditingSignup] = useInputState('');
	const [editingSession, setEditingSession] = useInputState('');

	const fetchScopes = useStable(async () => {
		const response = await adapter.getActiveSurreal().query(`INFO FOR DB`);
		const result = response[0].result;

		if (!result) {
			setScopes([]);
			return;
		}

		const scopeInfo = await map(Object.values(result.scopes ?? result.sc), async (definition) => {
			const result = await invoke('extract_scope_definition', { definition });

			return result as ScopeInfo;
		});

		setScopes(scopeInfo);
	});

	useEffect(() => {
		if (isOnline) {
			fetchScopes();
		}
	}, [isOnline]);

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

			await adapter.getActiveSurreal().query(query);
			await fetchScopes();
		} catch (err: any) {
			showError('Failed to save scope', err.message);
		}
	});

	const createAccount = useStable(() => {
		setIsEditing(true);
		setIsCreating(true);
		setEditingName('');
		setEditingSession('');
		setEditingSignin('');
		setEditingSignup('');
	});

	const editScope = useStable((scope: ScopeInfo) => {
		setIsEditing(true);
		setIsCreating(false);
		setEditingName(scope.name);
		setEditingSession(scope.session || '');
		setEditingSignin(scope.signin || '');
		setEditingSignup(scope.signup || '');
	});

	const removeScope = useStable(async (scope: string) => {
		await adapter.getActiveSurreal().query(`REMOVE SCOPE ${scope}`);
		await fetchScopes();
	});

	const closeModal = useStable(() => {
		setIsEditing(false);
	});

	return (
		<Panel
			icon={mdiAccountLock}
			title='Database Scopes'
			rightSection={
				<Group noWrap>
					<ActionIcon title='Add account' onClick={createAccount}>
						<Icon color='light.4' path={mdiPlus} />
					</ActionIcon>
					<ActionIcon title='Refresh' onClick={fetchScopes}>
						<Icon color='light.4' path={mdiRefresh} />
					</ActionIcon>
				</Group>
			}>
			{scopes.length === 0 && (
				<Center h='100%' c='light.5'>
					{isOnline ? 'No scopes found' : 'Not connected'}
				</Center>
			)}

			<Stack spacing={0}>
				{scopes.map((scope) => (
					<Group key={scope.name} spacing='xs' w='100%' noWrap>
						<Icon color='violet.4' path={mdiKeyVariant} size={0.85} />

						<Text color={isLight ? 'gray.9' : 'gray.0'}>{scope.name}</Text>
						<Spacer />
						<Text span color={isLight ? 'gray.4' : 'gray.7'} pl={6}>
							{scope.signin && scope.signup
								? 'Signup & Signin'
								: scope.signin
								? 'Signin only'
								: scope.signup
								? 'Signup only'
								: 'No auth'}
						</Text>
						<Menu position='right-start' shadow='sm' withArrow arrowOffset={18}>
							<Menu.Target>
								<Button size='xs' px={5} color='dark' variant='subtle'>
									<Icon path={mdiDotsVertical} />
								</Button>
							</Menu.Target>
							<Menu.Dropdown>
								<Menu.Item icon={<Icon path={mdiWrench} size={0.7} color='light.4' />} onClick={() => editScope(scope)}>
									Edit
								</Menu.Item>
								<Menu.Item
									icon={<Icon path={mdiDelete} size={0.7} color='red' />}
									onClick={() => removeScope(scope.name)}>
									Remove
								</Menu.Item>
							</Menu.Dropdown>
						</Menu>
					</Group>
				))}
			</Stack>

			<Modal
				size='md'
				opened={isEditing}
				onClose={closeEditing}
				trapFocus={false}
				title={
					<Title size={16} color={isLight ? 'light.6' : 'white'}>
						{isCreating ? 'Create scope' : 'Update scope'}
					</Title>
				}>
				<Form onSubmit={saveScope}>
					<Stack>
						{isCreating && (
							<TextInput
								label='Enter scope name'
								value={editingName}
								onChange={setEditingName}
								autoFocus
								required
							/>
						)}
						<Textarea
							label='Sign in query'
							placeholder='e.g. SELECT * FROM user ...'
							value={editingSignin}
							onChange={setEditingSignin}
							minRows={4}
							styles={{
								input: {
									fontFamily: 'JetBrains Mono',
								},
							}}
						/>
						<Textarea
							label='Sign up query'
							placeholder='e.g. CREATE USER ...'
							value={editingSignup}
							onChange={setEditingSignup}
							minRows={4}
							styles={{
								input: {
									fontFamily: 'JetBrains Mono',
								},
							}}
						/>
						<TextInput
							label='Session duration'
							placeholder='e.g. 12h'
							value={editingSession}
							onChange={setEditingSession}
						/>
					</Stack>
					<Group mt='lg'>
						<Button onClick={closeModal} color={isLight ? 'light.5' : 'light.3'} variant='light'>
							Close
						</Button>
						<Spacer />
						<Button color='surreal' disabled={!editingName} type='submit'>
							Save
						</Button>
					</Group>
				</Form>
			</Modal>
		</Panel>
	);
}
