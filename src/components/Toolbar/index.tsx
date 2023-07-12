import surrealistLogo from '~/assets/icon.png';
import { Group, Button, Modal, TextInput, Image } from "@mantine/core";
import { mdiPinOff, mdiPin, mdiHistory, mdiStar, mdiCloudDownload } from "@mdi/js";
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
import { ViewMode } from "~/typings";
import { adapter } from '~/adapter';
import { saveSchemaExport } from '~/util/schema';
import { useIsConnected } from '~/hooks/connection';
import { Selector } from './selector';
import { useTabsList } from '~/hooks/environment';
import { ViewTab } from '../ViewTab';

export interface ToolbarProps {
	viewMode: ViewMode;
	openConnection: () => void;
	closeConnection: () => void;
	onCreateTab: (environment: string) => void;
	onSaveEnvironments: () => void;
}

export function Toolbar(props: ToolbarProps) {
	const isLight = useIsLight();
	const isOnline = useIsConnected();
	const isPinned = useStoreValue(state => state.isPinned);
	const activeTab = useStoreValue(state => state.config.activeTab);
	
	const enableListing = useStoreValue(state => state.config.enableListing);
	const queryListing = useStoreValue(state => state.config.queryListing);

	const [ editingTab, setEditingTab ] = useState<string|null>(null);
	const [ tabName, setTabName ] = useState('');

	const pinnedTabs = useTabsList().filter(tab => tab.pinned);
	
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

	const togglePinned = useStable(() => {
		store.dispatch(actions.togglePinned());

		adapter.togglePinned();
		updateTitle();
	});

	const toggleHistory = useStable(() => {
		if (queryListing === 'history') {
			store.dispatch(actions.setShowQueryListing(!enableListing));
		} else {
			store.dispatch(actions.setQueryListingMode('history'));
			store.dispatch(actions.setShowQueryListing(true));
		}
		
		updateConfig();
	});

	const toggleFavorites = useStable(() => {
		if (queryListing === 'favorites') {
			store.dispatch(actions.setShowQueryListing(!enableListing));
		} else {
			store.dispatch(actions.setQueryListingMode('favorites'));
			store.dispatch(actions.setShowQueryListing(true));
		}

		updateConfig();
	});

	return (
		<Group
			p="xs"
			pos="relative"
			spacing="sm"
			bg={isLight ? 'white' : 'dark.7'}
			align="center"
			noWrap
		>
			{pinnedTabs.length > 0 && (
				<Group
					spacing={8}
					style={{
						position: 'absolute',
						inset: 0,
						marginInline: 'auto',
						width: 'max-content'
					}}
				>

					{pinnedTabs.map(tab => (
						<ViewTab
							key={tab.id}
							tabInfo={tab}
						/>
					))}
				</Group>
			)}

			<Image
				style={{ pointerEvents: 'none', userSelect: 'none' }}
				src={surrealistLogo}
				width={38}
			/>

			<Selector
				active={activeTab}
				isLight={isLight}
				onSave={props.onSaveEnvironments}
				onCreateTab={props.onCreateTab}
			/>

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
						color={isOnline ? (isLight ? 'light.8' : 'white') : undefined}
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