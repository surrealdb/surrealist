import classes from './style.module.scss';
import surrealistLogo from '~/assets/icon.png';
import { useInputState } from "@mantine/hooks";
import { Box, Button, Center, Dialog, Group, Image, Modal, Paper, Stack, Text, TextInput, Title } from "@mantine/core";
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
import { updateConfig } from '~/util/helpers';
import { TabBar } from '../TabBar';
import { Form } from '../Form';

export function Scaffold() {
	const activeTab = useStoreValue(state => state.activeTab);
	const tabList = useStoreValue(state => state.knownTabs);

	const createNewTab = useStable(() => {
		const tabId = uid(5);

		store.dispatch(actions.addTab({
			id: tabId,
			name: `Tab ${tabList.length + 1}`,
			endpoint: 'http://localhost:8080/',
			username: 'root',
			password: 'root',
			query: '',
			variables: {}
		}));

		store.dispatch(actions.setActiveTab(tabId));

		updateConfig();
	});

	const tabInfo = tabList.find(tab => tab.id === activeTab)!;

	const [ editingInfo, setEditingInfo ] = useState(false);
	const [ infoEndpoint, setInfoEndpoint ] = useInputState('');
	const [ infoUsername, setInfoUsername ] = useInputState('');
	const [ infoPassword, setInfoPassword ] = useInputState('');

	const openInfoEditor = useStable(() => {
		setEditingInfo(true);

		setInfoEndpoint(tabInfo.endpoint);
		setInfoUsername(tabInfo.username);
		setInfoPassword(tabInfo.password);
	});

	const closeEditingInfo = useStable(() => {
		setEditingInfo(false);
	});

	const saveInfo = useStable(() => {
		store.dispatch(actions.updateTab({
			id: activeTab!,
			endpoint: infoEndpoint,
			username: infoUsername,
			password: infoPassword
		}));

		updateConfig();
		closeEditingInfo();
	});

	return (
		<div className={classes.root}>
			<TabBar
				onCreateTab={createNewTab}
			/>

			{activeTab ? (
				<>
					<Group p="xs">
						<Image
							style={{ pointerEvents: 'none', userSelect: 'none' }}
							src={surrealistLogo}
							width={42}
						/>

						<Paper
							className={classes.input}
							onClick={openInfoEditor}
						>
							{/* <Paper
								bg="red.6"
								px="xs"
							>
								<Text
									color="white"
									size="xs"
									py={2}
									weight={600}
								>
									OFFLINE
								</Text>
							</Paper> */}
							<Paper
								bg="light.0"
								px="xs"
							>
								{tabInfo.username}
							</Paper>
							<Text>
								{tabInfo.endpoint}
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
							<Button size="xs" onClick={createNewTab}>
								Create tab
							</Button>
						</Center>
					</div>
				</Center>
			)}

			{/* ANCHOR Connection details modal */}
			<Modal
				opened={!!editingInfo}
				onClose={closeEditingInfo}
				title={
					<Title size={16}>
						Connection details
					</Title>
				}
			>
				<Form onSubmit={saveInfo}>
					<Stack>
						<TextInput
							style={{ flex: 1 }}
							label="Eendpoint URL"
							value={infoEndpoint}
							onChange={setInfoEndpoint}
							autoFocus
						/>
						<TextInput
							style={{ flex: 1 }}
							label="Username"
							value={infoUsername}
							onChange={setInfoUsername}
							autoFocus
						/>
						<TextInput
							style={{ flex: 1 }}
							label="Password"
							value={infoPassword}
							onChange={setInfoPassword}
							autoFocus
						/>
						<Group>
							<Button color="light.2" onClick={closeEditingInfo}>
								Back
							</Button>
							<Spacer />
							<Button type="submit">
								Save
							</Button>
						</Group>
					</Stack>
				</Form>
			</Modal>
		</div>
	)
}