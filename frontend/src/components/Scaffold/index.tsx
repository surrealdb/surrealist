import classes from './style.module.scss';
import surrealistLogo from '~/assets/icon.png';
import { Box, Button, Center, Dialog, Group, Image, Modal, Paper, Text, TextInput, Title } from "@mantine/core";
import { mdiCodeJson, mdiCog, mdiDatabase, mdiPin, mdiPinOff, mdiPlus, mdiTune } from "@mdi/js";
import { Icon } from "../Icon";
import { ViewTab } from "../ViewTab";
import { Spacer } from "./Spacer";
import { PanelSplitter } from '../PanelSplitter';
import { SplitDirection } from '@devbookhq/splitter';
import { Panel } from '../Panel';
import { actions, store, useStoreValue } from '~/store';
import { useStable } from '~/hooks/stable';
import { uid } from 'radash';
import { useState } from 'react';
import { Form } from '../Form';
import { updateConfig } from '~/util/helpers';

export function Scaffold() {
	const isPinned = useStoreValue(state => state.isPinned);
	const activeTab = useStoreValue(state => state.activeTab);
	const tabList = useStoreValue(state => state.knownTabs);

	const [ editingTab, setEditingTab ] = useState<string|null>(null);
	const [ tabName, setTabName ] = useState('');
	
	const addNewTab = useStable(() => {
		const tabId = uid(5);

		store.dispatch(actions.addTab({
			id: tabId,
			name: `Tab ${tabList.length + 1}`,
			endpoint: '',
			username: '',
			password: '',
			query: '',
			variables: {}
		}));

		store.dispatch(actions.setActiveTab(tabId));

		updateConfig();
	});

	const removeTab = useStable((id: string) => {
		store.dispatch(actions.removeTab(id));
		updateConfig();
	})
	
	const openTabEditor = useStable((tabId: string) => {
		const tab = tabList.find(tab => tab.id == tabId);
		
		if (!tab) {
			return;
		}
		
		setTabName(tab.name);
		setEditingTab(tab.id);
	});
	
	const closeEditingTab = useStable(() => {
		setEditingTab(null);
	});
	
	const saveTabName = useStable(() => {
		store.dispatch(actions.updateTab({
			id: editingTab!,
			name: tabName
		}));

		updateConfig();
		closeEditingTab();
	});

	const [ editingCon, setEditingCon] = useState(false);

	const togglePinned = useStable(() => {
		store.dispatch(actions.togglePinned());
	});
	
	return (
		<div className={classes.root}>
			<Group p="xs" spacing="sm" bg="white">
				<Button
					color="light.0"
					px="xs"
				>
					<Icon
						path={mdiCog}
						color="light.8"
					/>
				</Button>

				{tabList.map(tab => (
					<ViewTab
						key={tab.id}
						active={tab.id == activeTab}
						onDismiss={() => removeTab(tab.id)}
						onRename={() => openTabEditor(tab.id)}
						onActivate={() => store.dispatch(actions.setActiveTab(tab.id))}
					>
						{tab.name}
					</ViewTab>
				))}

				<Button
					px="xs"
					variant="subtle"
					color="light"
					leftIcon={<Icon path={mdiPlus} />}
					onClick={addNewTab}
				>
					New tab
				</Button>

				<Spacer />

				<Button
					px="xs"
					color="light.0"
					onClick={togglePinned}
				>
					<Icon
						path={isPinned ? mdiPinOff : mdiPin}
						color="light.8"
					/>
				</Button>
			</Group>

			{activeTab ? (
				<>
					<Group p="xs">
						<Image
							style={{ pointerEvents: 'none', userSelect: 'none' }}
							src={surrealistLogo}
							width={42}
						/>

						<Paper className={classes.input}>
							<Paper
								bg="light.0"
								px="xs"
							>
								root
							</Paper>
							<Text>
								https://localhost:8000/
							</Text>
							<Spacer />
							<Button
								color="surreal"
								style={{ borderRadius: 0 }}
							>
								Send Query
							</Button>
						</Paper>
					</Group>

					<Box p="xs" className={classes.content}>
						<PanelSplitter>
							<PanelSplitter direction={SplitDirection.Vertical}>
								<Panel title="Query" icon={mdiDatabase}>
									
								</Panel>
								<Panel title="Variables" icon={mdiTune}>
									
								</Panel>
							</PanelSplitter>
							
							<Panel title="Result" icon={mdiCodeJson}>
								
							</Panel>
						</PanelSplitter>
					</Box>
				</>
			) : (
				<Center h="100%">
					<div>
						<Image
							className={classes.emptyImage}
							src={surrealistLogo}
							width={120}
							mx="auto"
						/>
						<Title color="light" align="center" mt="md">
							Surrealist
						</Title>
						<Text color="light.2" align="center">
							Open or create a new tab to continue
						</Text>
						<Center mt="lg">
							<Button size="xs" onClick={addNewTab}>
								Create tab
							</Button>
						</Center>
					</div>
				</Center>
			)}
			
			{/* ANCHOR Tab rename modal */}
			<Modal
				opened={!!editingTab}
				onClose={closeEditingTab}
				withCloseButton={false}
			>
				<Form onSubmit={saveTabName}>
					<Group>
						<TextInput
							style={{ flex: 1 }}
							placeholder="Enter tab name"
							value={tabName}
							onChange={e => setTabName(e.target.value)}
							autoFocus
							onFocus={e => e.target.select()}
						/>
						<Button type="submit">
							Rename
						</Button>
					</Group>
				</Form>
			</Modal>

			{/* ANCHOR Connection details modal */}
			<Modal
				opened={!!editingTab}
				onClose={closeEditingTab}
				withCloseButton={false}
			>
				<Form onSubmit={saveTabName}>
					<Group>
						<TextInput
							style={{ flex: 1 }}
							placeholder="Enter tab name"
							value={tabName}
							onChange={e => setTabName(e.target.value)}
							autoFocus
							onFocus={e => e.target.select()}
						/>
						<Button type="submit">
							Rename
						</Button>
					</Group>
				</Form>
			</Modal>
		</div>
	)
}