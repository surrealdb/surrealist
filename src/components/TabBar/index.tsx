import surrealistLogo from '~/assets/icon.png';
import { Group, Button, Modal, TextInput, Image } from "@mantine/core";
import { mdiPlus, mdiPinOff, mdiPin, mdiHistory, mdiStar, mdiExport, mdiFolderDownload, mdiCloudDownload } from "@mdi/js";
import { useState } from "react";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { store, actions, useStoreValue } from "~/store";
import { updateConfig, updateTitle } from "~/util/helpers";
import { Form } from "../Form";
import { Icon } from "../Icon";
import { LocalDatabase } from "../LocalDatabase";
import { Spacer } from "../Spacer";
import { Settings } from "../Settings";
import { ViewTab } from "../ViewTab";
import { Sortable } from "../Sortable";
import { SurrealistTab, ViewMode } from "~/typings";
import { useHotkeys } from '@mantine/hooks';
import { adapter } from '~/adapter';
import { saveSchemaExport } from '~/util/schema';
import { useIsConnected } from '~/hooks/connection';

export interface TabBarProps {
	viewMode: ViewMode;
	openConnection: () => void;
	closeConnection: () => void;
	onCreateTab: () => void;
	onSwitchTab: () => void;
}

export function TabBar(props: TabBarProps) {
	const isLight = useIsLight();
	const isOnline = useIsConnected();
	const isPinned = useStoreValue(state => state.isPinned);
	const activeTab = useStoreValue(state => state.config.activeTab);
	const tabList = useStoreValue(state => state.config.tabs);
	const enableListing = useStoreValue(state => state.config.enableListing);
	const queryListing = useStoreValue(state => state.config.queryListing);

	const [ editingTab, setEditingTab ] = useState<string|null>(null);
	const [ tabName, setTabName ] = useState('');
	
	const removeTab = useStable((id: string) => {
		store.dispatch(actions.removeTab(id));

		updateTitle();
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

		updateTitle();
		updateConfig();
		closeEditingTab();
	});

	const selectTab = useStable((id: string) => {
		store.dispatch(actions.setActiveTab(id));

		props.onSwitchTab();
		updateTitle();
		updateConfig();
	});

	const selectTabByIndex = useStable((index: number) => {
		const tab = tabList[index];

		if (tab) {
			selectTab(tab.id);
		}
	});

	const togglePinned = useStable(() => {
		store.dispatch(actions.togglePinned());

		adapter.togglePinned();
		updateTitle();
	});

	const toggleHistory = useStable(() => {
		if (queryListing !== 'history') {
			store.dispatch(actions.setQueryListingMode('history'));
			store.dispatch(actions.setShowQueryListing(true));
		} else {
			store.dispatch(actions.setShowQueryListing(!enableListing));
		}
		
		updateConfig();
	});

	const toggleFavorites = useStable(() => {
		if (queryListing !== 'favorites') {
			store.dispatch(actions.setQueryListingMode('favorites'));
			store.dispatch(actions.setShowQueryListing(true));
		} else {
			store.dispatch(actions.setShowQueryListing(!enableListing));
		}

		updateConfig();
	});

	const saveTabOrder = useStable((items: SurrealistTab[]) => {
		store.dispatch(actions.setTabs(items));
		updateConfig();
	});

	useHotkeys([
		['ctrl+n', props.onCreateTab],

		['ctrl+1', () => selectTabByIndex(0)],
		['ctrl+2', () => selectTabByIndex(1)],
		['ctrl+3', () => selectTabByIndex(2)],
		['ctrl+4', () => selectTabByIndex(3)],
		['ctrl+5', () => selectTabByIndex(4)],
		['ctrl+6', () => selectTabByIndex(5)],
		['ctrl+7', () => selectTabByIndex(6)],
		['ctrl+8', () => selectTabByIndex(7)],
		['ctrl+9', () => selectTabByIndex(8)],
		['ctrl+0', () => selectTabByIndex(9)],
	], []);

	return (
		<Group
			p="xs"
			spacing="sm"
			bg={isLight ? 'white' : 'dark.7'}
			align="center"
			noWrap
		>
			<Image
				style={{ pointerEvents: 'none', userSelect: 'none' }}
				src={surrealistLogo}
				width={38}
			/>

			<Group>
				<Sortable
					items={tabList}
					onSorted={saveTabOrder}
					direction="grid"
					constraint={{
						distance: 12
					}}
				>
					{({ item, handleProps }) => (
						<div {...handleProps}>
							<ViewTab
								id={item.id}
								key={item.id}
								active={item.id == activeTab}
								onDismiss={() => removeTab(item.id)}
								onRename={() => openTabEditor(item.id)}
								onActivate={() => selectTab(item.id)}
							>
								{item.name}
							</ViewTab>
						</div>
					)}
				</Sortable>

				<Button
					px="xs"
					variant="subtle"
					color="light"
					leftIcon={<Icon path={mdiPlus} />}
					onClick={props.onCreateTab}
				>
					New tab
				</Button>
			</Group>

			<Spacer />

			{adapter.isServeSupported && (
				<LocalDatabase
					openConnection={props.openConnection}
					closeConnection={props.closeConnection}
				/>	
			)}

			{props.viewMode == 'query' && (
				<>
					<Button
						px="xs"
						color={isLight ? 'light.0' : 'dark.4'}
						title="Toggle history"
						onClick={toggleHistory}
					>
						<Icon
							path={mdiHistory}
							color={isLight ? 'light.8' : 'white'}
						/>
					</Button>

					<Button
						px="xs"
						color={isLight ? 'light.0' : 'dark.4'}
						title="Toggle favorites"
						onClick={toggleFavorites}
					>
						<Icon
							path={mdiStar}
							color={isLight ? 'light.8' : 'white'}
						/>
					</Button>
				</>
			)}

			{props.viewMode == 'designer' && (
				<Button
					px="xs"
					color={isLight ? 'light.0' : 'dark.4'}
					title="Export schema to file"
					onClick={saveSchemaExport}
					disabled={!isOnline}
				>
					<Icon
						path={mdiCloudDownload}
						color={!isOnline ? undefined : isLight ? 'light.8' : 'white'}
					/>
				</Button>
			)}
			
			{adapter.isPinningSupported && (
				<Button
					px="xs"
					color={isLight ? 'light.0' : 'dark.4'}
					title={isPinned ? 'Unpin window' : 'Pin window'}
					onClick={togglePinned}
				>
					<Icon
						path={isPinned ? mdiPinOff : mdiPin}
						color={isLight ? 'light.8' : 'white'}
					/>
				</Button>
			)}

			<Settings />

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
		
		</Group>
	);
}