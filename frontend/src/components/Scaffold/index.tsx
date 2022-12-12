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
import { updateConfig } from '~/util/helpers';
import { TabBar } from '../TabBar';

export function Scaffold() {
	const activeTab = useStoreValue(state => state.activeTab);
	const tabList = useStoreValue(state => state.knownTabs);

	const createNewTab = useStable(() => {
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

	const [ editingCon, setEditingCon] = useState(false);

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
							<Button size="xs" onClick={createNewTab}>
								Create tab
							</Button>
						</Center>
					</div>
				</Center>
			)}

			{/* ANCHOR Connection details modal */}
			{/* <Modal
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
			</Modal> */}
		</div>
	)
}