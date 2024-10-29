import classes from "./style.module.scss";

import { ActionIcon, Divider, Group, Menu, Stack, Text, TextInput, Tooltip } from "@mantine/core";

import {
	iconClose,
	iconDelete,
	iconDotsVertical,
	iconQuery,
	iconSearch,
	iconText,
} from "~/util/icons";

import { Box, Drawer } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import dayjs from "dayjs";
import { capitalize } from "radash";
import { memo, useMemo } from "react";
import { CodePreview } from "~/components/CodePreview";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useActiveConnection, useActiveQuery } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";
import type { HistoryQuery } from "~/types";

const MAX_PREVIEW_LENGTH = 500;

interface HistoryRowProps {
	entry: HistoryQuery;
	onUpdateBuffer: (query: string) => void;
	onClose: () => void;
}

function HistoryRow({ entry, onUpdateBuffer, onClose }: HistoryRowProps) {
	const { updateCurrentConnection, addQueryTab } = useConfigStore.getState();

	const connection = useActiveConnection();
	const activeTab = useActiveQuery();

	const handleUseQuery = useStable(() => {
		onClose();
		addQueryTab({
			type: "config",
			query: entry.query,
		});
	});

	const handleReplaceQuery = useStable(() => {
		if (!activeTab) return;

		onClose();
		onUpdateBuffer(entry.query);
	});

	const handleDeleteQuery = useStable(() => {
		updateCurrentConnection({
			queryHistory: connection.queryHistory.filter((item) => item !== entry),
		});
	});

	const shortQuery = useMemo(() => {
		return entry.query.length > MAX_PREVIEW_LENGTH
			? `${entry.query.slice(0, MAX_PREVIEW_LENGTH)}...`
			: entry.query;
	}, [entry.query]);

	return (
		<Box>
			<Group
				h={28}
				wrap="nowrap"
			>
				<Group
					gap="xs"
					wrap="nowrap"
					miw={0}
				>
					<Text
						c="bright"
						style={{ flexShrink: 0 }}
					>
						{capitalize(dayjs(entry.timestamp).fromNow())}
					</Text>
					{entry.origin && (
						<Text
							c="slate"
							truncate
							miw={0}
						>
							from {entry.origin}
						</Text>
					)}
				</Group>
				<Spacer />
				<Menu position="right-start">
					<Menu.Target>
						<ActionIcon>
							<Icon path={iconDotsVertical} />
						</ActionIcon>
					</Menu.Target>
					<Menu.Dropdown>
						<Menu.Label>Open</Menu.Label>
						<Menu.Item
							onClick={handleUseQuery}
							leftSection={<Icon path={iconQuery} />}
						>
							Open in new tab
						</Menu.Item>
						<Menu.Item
							onClick={handleReplaceQuery}
							leftSection={<Icon path={iconText} />}
						>
							Open in current tab
						</Menu.Item>
						<Menu.Label mt="sm">Dangerous</Menu.Label>
						<Menu.Item
							c="red"
							onClick={handleDeleteQuery}
							leftSection={
								<Icon
									path={iconDelete}
									c="red"
								/>
							}
						>
							Remove from history
						</Menu.Item>
					</Menu.Dropdown>
				</Menu>
			</Group>

			<CodePreview
				mt="xs"
				value={shortQuery}
				withWrapping
			/>

			<Divider mt="md" />
		</Box>
	);
}

const HistoryRowLazy = memo(HistoryRow);

export interface HistoryDrawerProps {
	opened: boolean;
	onUpdateBuffer: (query: string) => void;
	onClose: () => void;
}

export function HistoryDrawer({ opened, onUpdateBuffer, onClose }: HistoryDrawerProps) {
	const { updateCurrentConnection } = useConfigStore.getState();

	const connection = useActiveConnection();
	const [filterText, setFilterText] = useInputState("");

	const clearHistory = useStable(() => {
		updateCurrentConnection({
			queryHistory: [],
		});
	});

	const filtered = useMemo(() => {
		if (!connection) return [];

		const needle = filterText.toLowerCase();

		return connection.queryHistory
			.filter((entry) => entry.query.toLowerCase().includes(needle))
			.reverse();
	}, [connection, filterText]);

	return (
		<Drawer
			opened={opened}
			onClose={onClose}
			position="right"
			trapFocus={false}
		>
			<Group
				mb="md"
				gap="sm"
			>
				<PrimaryTitle>Query history</PrimaryTitle>

				<Spacer />

				<Tooltip label="Clear history">
					<ActionIcon
						onClick={clearHistory}
						title="Clear history"
						aria-label="Clear query history"
						color="red"
					>
						<Icon path={iconDelete} />
					</ActionIcon>
				</Tooltip>

				<ActionIcon
					onClick={onClose}
					aria-label="Close history drawer"
				>
					<Icon path={iconClose} />
				</ActionIcon>
			</Group>
			<Stack>
				<TextInput
					autoFocus
					placeholder="Search history..."
					leftSection={<Icon path={iconSearch} />}
					value={filterText}
					spellCheck={false}
					onChange={setFilterText}
				/>

				{filtered.length === 0 && (
					<Text
						ta="center"
						mt="sm"
						c="slate"
					>
						No queries to display
					</Text>
				)}

				{filtered.map((entry, i) => (
					<HistoryRowLazy
						key={i}
						entry={entry}
						onUpdateBuffer={onUpdateBuffer}
						onClose={onClose}
					/>
				))}
			</Stack>
		</Drawer>
	);
}
