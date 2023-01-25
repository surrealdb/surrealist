import classes from './style.module.scss';
import { ActionIcon, Box, Button, Collapse, Divider, Group, Modal, ScrollArea, Stack, Text, Textarea, TextInput, Title, useMantineTheme } from "@mantine/core";
import { mdiClose, mdiContentCopy, mdiDelete, mdiMagnify, mdiPencil, mdiPlay, mdiPlus, mdiStar } from "@mdi/js";
import { Fragment, useMemo, useState } from "react";
import { useIsLight } from "~/hooks/theme";
import { actions, store, useStoreValue } from "~/store";
import { Panel } from "../Panel";
import { useStable } from '~/hooks/stable';
import { Icon } from '../Icon';
import { useHover, useInputState } from '@mantine/hooks';
import { FavoritesEntry, SurrealistTab } from '~/typings';
import { showNotification } from '@mantine/notifications';
import { useActiveTab } from '~/hooks/tab';
import { Form } from '../Form';
import { Spacer } from '../Spacer';
import { uid } from 'radash';
import { updateConfig } from '~/util/helpers';

export interface FavoritesPaneProps {
	onExecuteQuery: () => void;
}

export function FavoritesPane(props: FavoritesPaneProps) {
	const isLight = useIsLight();
	const activeTab = useActiveTab();
	const entries = useStoreValue(state => state.config.queryFavorites);
	const [search, setSearch] = useInputState('');

	const filtered = useMemo(() => {
		const needle = search.toLowerCase();

		return entries
			.filter(entry => entry.name.toLowerCase().includes(needle) || entry.query.toLowerCase().includes(needle))
			.sort((a, b) => a.name.localeCompare(b.name));
	}, [search, entries]);

	const historyList = useMemo(() => {
		if (filtered.length === 0) {
			return (
				<Text align="center" mt="sm">
					No results found
				</Text>
			)
		}

		return filtered.map((entry, i) => (
			<Fragment key={i}>
				<FavoriteRow
					entry={entry}
					isLight={isLight}
					activeTab={activeTab}
					onExecuteQuery={props.onExecuteQuery}
				/>
				{i !== entries.length - 1 && (
					<Divider
						color={isLight ? 'light.0' : 'dark.5'}
					/>
				)}
			</Fragment>
		));
	}, [activeTab, filtered, isLight]);

	return (
		<Panel
            title="Saved queries"
            icon={mdiStar}
			rightSection={
				<FavoritesActions
					activeTab={activeTab}
				/>
			}
        >
			<ScrollArea
				style={{
					position: 'absolute',
					inset: 12,
					top: 0
				}}
			>
				<TextInput
					placeholder="Search queries..."
					icon={<Icon path={mdiMagnify} />}
					value={search}
					onChange={setSearch}
					mb="lg"
				/>

				<Stack spacing="sm">
					{historyList}
				</Stack>
			</ScrollArea>
		</Panel>
	);
}

interface HistoryRowProps {
	entry: FavoritesEntry;
	isLight: boolean;
	activeTab: SurrealistTab | undefined;
	onExecuteQuery: () => void;
}

function FavoriteRow({ activeTab, entry, isLight, onExecuteQuery }: HistoryRowProps) {
	const theme = useMantineTheme();
	const { ref, hovered } = useHover();

	const removeEntry = useStable(() => {
		store.dispatch(actions.removeFavoritesEntry(entry.id));
	});

	const copyQuery = useStable(() => {
		navigator.clipboard.writeText(entry.query);

		showNotification({
			color: 'green.6',
			message: 'Query copied to clipboard'
		});
	});

	const editQuery = useStable(() => {
		store.dispatch(actions.updateTab({
			id: activeTab?.id,
			query: entry.query
		}));
	});

	const executeQuery = useStable(() => {
		editQuery();
		
		setTimeout(onExecuteQuery, 0);
	});

	return (
		<Box
			ref={ref}
			color={isLight ? 'light.0' : 'dark.4'}
			className={classes.entry}
			style={{ borderColor: theme.fn.themeColor(isLight ? 'light.0' : 'dark.3') }}
		>
			<Text
				c="yellow.8"
				mb={4}
			>
				{entry.name}
			</Text>

			<Text
				ff="JetBrains Mono"
				c={isLight ? 'black' : 'white'}
				className={classes.queryText}
				lineClamp={5}
				weight={600}
			>
				{entry.query}
			</Text>

			<Collapse
				in={hovered}
			>
				<Group mr="lg" mt="xs" pb="xs" spacing="xs">
					<ActionIcon
						color="red"
						radius="sm"
						title="Remove"
						onClick={removeEntry}
					>
						<Icon path={mdiDelete} color="red" size={0.85} />
					</ActionIcon>
					<ActionIcon
						color="light.5"
						radius="sm"
						title="Copy to clipboard"
						onClick={copyQuery}
					>
						<Icon path={mdiContentCopy} color="light.5" size={0.85} />
					</ActionIcon>
					<ActionIcon
						color="violet"
						radius="sm"
						title="Edit query"
						onClick={editQuery}
					>
						<Icon path={mdiPencil} color="violet" size={0.85} />
					</ActionIcon>
					<ActionIcon
						color="surreal"
						radius="sm"
						title="Run query"
						onClick={executeQuery}
					>
						<Icon path={mdiPlay} color="surreal" size={0.85} />
					</ActionIcon>
				</Group>
			</Collapse>
		</Box>
	);
}

interface FavoritesActionsProps {
	activeTab: SurrealistTab | undefined;
}

function FavoritesActions(props: FavoritesActionsProps) {
	const isLight = useIsLight();
	const [isSaving, setIsSaving] = useState(false);
	const [queryName, setQueryName] = useInputState('');
	const [queryText, setQueryText] = useInputState('');

	const query = props.activeTab?.query?.trim() || '';
	const canSave = query.length > 0;

	const hideFavorites = useStable(() => {
		store.dispatch(actions.setShowQueryListing(false));
		updateConfig();
	});

	const openSaveBox = useStable(() => {
		setIsSaving(true);
		setQueryName('');
		setQueryText(query);
	});

	const closeSaving = useStable(() => {
		setIsSaving(false);
	});

	const saveQuery = useStable(() => {
		setIsSaving(false);

		store.dispatch(actions.addFavoritesEntry({
			id: uid(5),
			name: queryName,
			query: queryText
		}));
	});

	return (
		<Group align="center">
			{canSave && (
				<ActionIcon
					onClick={openSaveBox}
					title="Save current query"
				>
					<Icon color="light.4" path={mdiPlus} />
				</ActionIcon>
			)}
			<ActionIcon
				onClick={hideFavorites}
				title="Hide favorites"
			>
				<Icon color="light.4" path={mdiClose} />
			</ActionIcon>

			<Modal
				opened={isSaving}
				onClose={closeSaving}
				trapFocus={false}
				title={
					<Title size={16} color={isLight ? 'light.6' : 'white'}>
						Save query
					</Title>
				}
			>
				<Form onSubmit={saveQuery}>
					<Stack>
						<TextInput
							placeholder="Enter query name"
							value={queryName}
							onChange={setQueryName}
							autoFocus
						/>
						<Textarea
							placeholder="SELECT * FROM ..."
							value={queryText}
							onChange={setQueryText}
							minRows={8}
						/>
						<Group>
							<Button color="light" onClick={closeSaving}>
								Close
							</Button>
							<Spacer />
							<Button type="submit">
								Save
							</Button>
						</Group>
					</Stack>
				</Form>
			</Modal>
		</Group>
	);
}