import classes from './style.module.scss';
import { ActionIcon, Box, Button, Collapse, Divider, Group, Paper, ScrollArea, SimpleGrid, Stack, Text, TextInput, useMantineTheme } from "@mantine/core";
import { mdiClose, mdiContentCopy, mdiDelete, mdiHistory, mdiMagnify, mdiPencil, mdiPlay } from "@mdi/js";
import { Fragment, useMemo } from "react";
import { useIsLight } from "~/hooks/theme";
import { actions, store, useStoreValue } from "~/store";
import { Panel } from "../Panel";
import dayjs from 'dayjs';
import { useStable } from '~/hooks/stable';
import { Icon } from '../Icon';
import { useHover, useInputState } from '@mantine/hooks';
import { HistoryEntry, SurrealistTab } from '~/typings';
import { showNotification } from '@mantine/notifications';
import { useActiveTab } from '~/hooks/tab';
import { updateConfig } from '~/util/helpers';

export interface HistoryPaneProps {
	onExecuteQuery: () => void;
}

export function HistoryPane(props: HistoryPaneProps) {
	const isLight = useIsLight();
	const activeTab = useActiveTab();
	const entries = useStoreValue(state => state.config.queryHistory);
	const [search, setSearch] = useInputState('');

	const filtered = useMemo(() => {
		const needle = search.toLowerCase();

		return entries.filter(entry => entry.query.toLowerCase().includes(needle));
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
				<HistoryRow
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
            title="History"
            icon={mdiHistory}
			rightSection={<HistoryActions />}
        >
			<ScrollArea
				style={{
					position: 'absolute',
					inset: 12,
					top: 0
				}}
			>
				<TextInput
					placeholder="Search history..."
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
	entry: HistoryEntry;
	isLight: boolean;
	activeTab: SurrealistTab | undefined;
	onExecuteQuery: () => void;
}

function HistoryRow({ activeTab, entry, isLight, onExecuteQuery }: HistoryRowProps) {
	const theme = useMantineTheme();
	const { ref, hovered } = useHover();

	const removeEntry = useStable(() => {
		store.dispatch(actions.removeHistoryEntry(entry.id));
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
				c={isLight ? 'light.3' : 'light.4'}
				mb={4}
			>
				{dayjs(entry.timestamp).fromNow()}
			</Text>

			<Paper
				withBorder
				mt="xs"
				p="xs"
			>
				<Text
					ff="JetBrains Mono"
					c={isLight ? 'black' : 'white'}
					className={classes.queryText}
					lineClamp={8}
					weight={600}
				>
					{entry.query}
				</Text>
			</Paper>

			<Collapse
				in={hovered}
			>
				<SimpleGrid cols={3} mt="xs" pb="xs" spacing="xs">
					<Button
						size="xs"
						variant="light"
						color="red"
						radius="sm"
						title="Remove"
						onClick={removeEntry}
					>
						<Icon path={mdiDelete} color="red" />
					</Button>
					<Button
						size="xs"
						variant="light"
						color="violet"
						radius="sm"
						title="Edit query"
						onClick={editQuery}
					>
						<Icon path={mdiPencil} color="violet" />
					</Button>
					<Button
						size="xs"
						variant="light"
						color="pink"
						radius="sm"
						title="Run query"
						onClick={executeQuery}
					>
						<Icon path={mdiPlay} color="pink" />
					</Button>
				</SimpleGrid>
			</Collapse>
		</Box>
	);
}

function HistoryActions() {

	const clearHistory = useStable(() => {
		store.dispatch(actions.clearHistory());
	});

	const hideHistory = useStable(() => {
		store.dispatch(actions.setShowQueryListing(false));
		updateConfig();
	});

	return (
		<Group align="center">
			<ActionIcon
				onClick={clearHistory}
				title="Clear history"
			>
				<Icon color="light.4" path={mdiDelete} />
			</ActionIcon>

			<ActionIcon
				onClick={hideHistory}
				title="Hide history"
			>
				<Icon color="light.4" path={mdiClose} />
			</ActionIcon>
		</Group>
	);
}