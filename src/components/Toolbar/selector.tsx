import classes from './style.module.scss';
import { Box, Button, Divider, Group, Menu, Popover, ScrollArea, SimpleGrid, Stack, TextInput } from "@mantine/core";
import { mdiMenuDown, mdiDatabase, mdiPlus, mdiChevronRight, mdiMagnify, mdiClose, mdiPencil, mdiDotsVertical, mdiCursorText, mdiContentDuplicate, mdiPinOff, mdiPin } from "@mdi/js";
import { Icon } from "../Icon";
import { SurrealistTab } from "~/typings";
import { Text } from "@mantine/core";
import { actions, store, useStoreValue } from "~/store";
import { VIEW_MODES } from '~/constants';
import { useStable } from '~/hooks/stable';
import { updateTitle, updateConfig, applyOrder } from '~/util/helpers';
import { MouseEvent, useEffect, useMemo, useState } from 'react';
import { useHotkeys, useInputState } from '@mantine/hooks';
import { Environments } from './environments';
import { SyntheticEvent } from 'react';
import { Sortable } from '../Sortable';

function getTabIcon(tab: SurrealistTab) {
	return VIEW_MODES.find(v => v.id == tab.activeView)?.icon;
}

export interface SelectorProps {
	active: string | null;
	isLight: boolean;
	onSave: () => void;
	onCreateTab: (environment: string) => void;
}

export function Selector({ active, isLight, onSave, onCreateTab }: SelectorProps) {
	const [ opened, setOpened ] = useState(false);
	const [ manageEnvs, setManageEnvs ] = useState(false);
	const [ viewingEnv, setViewingEnv ] = useState('');
	const [ renamingTab, setRenamingTab ] = useState('');
	const [ tabName, setTabName ] = useInputState('');
	const [ search, setSearch ] = useInputState('');

	const tabs = useStoreValue(state => state.config.tabs);
	const environments = useStoreValue(state => state.config.environments);

	const tab = tabs.find(tab => tab.id === active);
	const environment = tab && environments.find(env => env.id === tab.environment);

	const stopPropagation = useStable((e: any) => {
		e.stopPropagation();
	})

	const filteredTabs = useMemo(() => {
		const needle = search.toLowerCase();
		
		return tabs.filter(tab => tab.environment === viewingEnv && (!needle || tab.name.toLowerCase().includes(needle)));
	}, [tabs, viewingEnv, search]);
	
	const select = useStable((id: string) => {
		if (renamingTab) {
			return;
		}

		store.dispatch(actions.setActiveTab(id));

		updateTitle();
		updateConfig();
		setOpened(false);
	});

	const openTab = useStable((index: number) => {
		const tab = filteredTabs[index];

		if (tab) {
			select(tab.id);
		}
	});

	const openEnvironment = useStable((id: string) => {
		setViewingEnv(id);
	});

	const createTab = useStable(() => {
		setOpened(false);
		onCreateTab(viewingEnv);
	});
	
	const handleRename = useStable((e: MouseEvent, id: string) => {
		e.stopPropagation();

		const current = tabs.find(tab => tab.id === id)?.name || '';

		setRenamingTab(id);
		setTabName(current);
	});

	const handleEdit = useStable((e: MouseEvent, id: string) => {
		e.stopPropagation();

		setOpened(false);

		store.dispatch(actions.openTabEditor(id));
	});

	const handlePin = useStable((e: MouseEvent, id: string) => {
		e.stopPropagation();

		const pinned = tabs.find(tab => tab.id === id)?.pinned ?? false;

		store.dispatch(actions.updateTab({
			id: id,
			pinned: !pinned
		}));
	});

	const handleDuplicate = useStable((e: MouseEvent, id: string) => {
		e.stopPropagation();

		setOpened(false);

		const details = tabs.find(tab => tab.id === id)?.connection || {};

		store.dispatch(actions.openTabCreator({
			environment: viewingEnv,
			connection: details
		}));
	});

	const handleDelete = useStable((e: MouseEvent, id: string) => {
		e.stopPropagation();

		store.dispatch(actions.removeTab(id));
	});

	const saveRename = useStable((e: SyntheticEvent) => {
		if ('key' in e && e.key !== 'Enter') {
			return;
		}

		const info = tabs.find(tab => tab.id === renamingTab);
		
		if (!info) {
			return;
		}

		store.dispatch(actions.updateTab({
			...info,
			name: tabName
		}));

		setRenamingTab('');
		setTabName('');
		
		updateConfig();
		updateTitle();
	});

	const openEnvManager = useStable(() => {
		setManageEnvs(true);
		setOpened(false);
	});

	const closeEnvManager = useStable(() => {
		setManageEnvs(false);
	});

	const saveTabOrder = useStable((order: SurrealistTab[]) => {
		store.dispatch(actions.setTabs(
			applyOrder(tabs, order)
		));

		// store.dispatch(actions.updateTabOrder(order));
		// updateConfig();
	});

	useEffect(() => {
		if (!viewingEnv) {
			const startEnv = environment?.id || environments[0]?.id;

			if (startEnv) {
				setViewingEnv(startEnv);
			}
		}
	}, [environments, environment]);
	
	useHotkeys([
		['ctrl+1', () => openTab(0)],
		['ctrl+2', () => openTab(1)],
		['ctrl+3', () => openTab(2)],
		['ctrl+4', () => openTab(3)],
		['ctrl+5', () => openTab(4)],
		['ctrl+6', () => openTab(5)],
		['ctrl+7', () => openTab(6)],
		['ctrl+8', () => openTab(7)],
		['ctrl+9', () => openTab(8)],
		['ctrl+0', () => openTab(9)],
		['ctrl+n', () => createTab]
	], []);

	return (
		<>
			<Popover
				opened={opened}
				onChange={setOpened}
				position="bottom-start"
				exitTransitionDuration={0}
				closeOnEscape
				shadow={`0 8px 25px rgba(0, 0, 0, ${isLight ? 0.35 : 0.75})`}
				withArrow
			>
				<Popover.Target>
					<Button
						px="xs"
						variant="subtle"
						color="light"
						onClick={() => setOpened(!opened)}
					>
						<Group spacing={6}>
							<Icon path={mdiDatabase} />
							{tab && environment ? (
								<>
									<Text>{environment.name}</Text>
									<Icon path={mdiChevronRight} color="dark.3" />
									<Text color={isLight ? 'black' : 'white'}>
										{tab.name}
									</Text>
								</>
							) : (
								<Text color="light.4">Select tab</Text>
							)}
							<Icon path={mdiMenuDown} />
						</Group>
					</Button>
				</Popover.Target>
				<Popover.Dropdown px="xs">
					<SimpleGrid cols={2}>
						<Box mih={235} mah={350}>
							<ScrollArea h="calc(100% - 54px)">
								<Stack spacing="xs">
									{environments.map(item => {
										const isActive = item.id === viewingEnv;

										return (
											<Button
												key={item.id}
												w={264}
												px={12}
												c={isLight ? 'black' : 'white'}
												color={isActive ? (isLight ? 'light.1' : 'dark.7') : 'light'}
												variant={isActive ? 'filled' : 'subtle'}
												className={classes.entryButton}
												onClick={() => openEnvironment(item.id)}
											>
												{item.name}
											</Button>
										)
									})}
								</Stack>
							</ScrollArea>

							<Divider
								color={isLight ? 'light.0' : 'dark.4'}
								my="xs"
							/>

							<Button
								w={264}
								px={12}
								color="light"
								variant="subtle"
								className={classes.manageButton}
								onClick={openEnvManager}
								rightIcon={<Icon path={mdiChevronRight} />}
							>
								Manage environments
							</Button>
						</Box>
						<Box mih={235} mah={300}>
							<TextInput
								placeholder="Search"
								variant="filled"
								icon={<Icon path={mdiMagnify} color="dark.3" />}
								style={{ flex: 1 }}
								value={search}
								onChange={setSearch}
								autoFocus
								mb="sm"
							/>
							<ScrollArea h="calc(100% - 102px)">
								<Stack spacing={6}>
									{filteredTabs.length === 0 && tabs.length > 0 && (
										<Text
											align="center"
											py={7}
											c="dark.2"
										>
											No tabs found
										</Text>	
									)}

									<Sortable
										items={filteredTabs}
										disabled={!!search}
										onSorted={saveTabOrder}
										constraint={{
											distance: 10
										}}
									>
										{({ item, handleProps }) => {
											const isActive = item.id === tab?.id;
											const isRenaming = renamingTab == item.id;
	
											return (
												<Button
													key={item.id}
													w={264}
													px={12}
													leftIcon={
														isRenaming
															? <Icon path={mdiPencil} color="blue" />
															: <Icon path={getTabIcon(item) ?? ''} color="surreal" />
													}
													c={isLight ? 'black' : 'white'}
													color={isRenaming ? 'light' : isActive ? 'pink' : 'light'}
													variant={isRenaming ? 'outline' : isActive ? 'light' : 'subtle'}
													className={classes.entryButton}
													onClick={() => select(item.id)}
													{...handleProps}
													rightIcon={!isRenaming && (
														<Menu
															shadow="md"
															width={200}
															position="right-start"
															closeOnItemClick={false}
															withinPortal
														>
															<Menu.Target>
																<div onClick={stopPropagation}>
																	<Icon path={mdiDotsVertical} />
																</div>
															</Menu.Target>
	
															<Menu.Dropdown onMouseDown={stopPropagation}>
																<Menu.Item
																	icon={<Icon path={mdiCursorText} />}
																	onClick={e => handleRename(e, item.id)}
																>
																	Rename
																</Menu.Item>
																<Menu.Item
																	icon={<Icon path={mdiPencil} />}
																	onClick={e => handleEdit(e, item.id)}
																>
																	Edit
																</Menu.Item>
																<Menu.Item
																	icon={<Icon path={item.pinned ? mdiPinOff : mdiPin} />}
																	onClick={e => handlePin(e, item.id)}
																>
																	{item.pinned ? 'Unpin' : 'Pin'}
																</Menu.Item>
																<Menu.Item
																	icon={<Icon path={mdiContentDuplicate} />}
																	onClick={e => handleDuplicate(e, item.id)}
																>
																	Duplicate
																</Menu.Item>
																<Menu.Item
																	icon={<Icon path={mdiClose} />}
																	onClick={e => handleDelete(e, item.id)}
																>
																	Delete
																</Menu.Item>
															</Menu.Dropdown>
														</Menu>
													)}
												>
													{isRenaming ? (
														<TextInput
															autoFocus
															variant="unstyled"
															value={tabName}
															onChange={setTabName}
															onBlur={saveRename}
															onKeyDown={saveRename}
															styles={{
																input: {
																	fontWeight: 600,
																	color: 'white',
																	maxWidth: 150,
																	padding: 0,
																	margin: 0,
																	marginTop: -1
																}
															}}
														/>
													) : (
														<Text
															maw={150}
															style={{
																overflow: 'hidden',
																textOverflow: 'ellipsis',
																whiteSpace: 'nowrap'
															}}
														>
															{item.name}
														</Text>
													)}
												</Button>
											)
										}}
									</Sortable>
								</Stack>
							</ScrollArea>

							<Divider
								color={isLight ? 'light.0' : 'dark.4'}
								my="xs"
							/>

							<Button
								w={264}
								px={12}
								color="light"
								variant="subtle"
								className={classes.entryButton}
								leftIcon={<Icon path={mdiPlus} />}
								onClick={createTab}
							>
								Add session
							</Button>
						</Box>
					</SimpleGrid>
				</Popover.Dropdown>
			</Popover>

			<Environments
				opened={manageEnvs}
				onClose={closeEnvManager}
				onSave={onSave}
			/>
		</>
	)
}