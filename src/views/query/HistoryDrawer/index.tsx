import classes from "./style.module.scss";

import dayjs from "dayjs";
import { ActionIcon, Divider, Group, Stack, Text, TextInput, Tooltip } from "@mantine/core";
import { Box, Drawer } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { Icon } from "~/components/Icon";
import { ModalTitle } from "~/components/ModalTitle";
import { useActiveConnection, useActiveQuery } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";
import { HistoryQuery } from "~/types";
import { Spacer } from "~/components/Spacer";
import { useMemo } from "react";
import { useIsLight } from "~/hooks/theme";
import { useContextMenu } from "mantine-contextmenu";
import { iconClose, iconDelete, iconQuery, iconSearch, iconText } from "~/util/icons";
import { CodePreview } from "~/components/CodePreview";
import { capitalize } from "radash";

interface HistoryRowProps {
	entry: HistoryQuery;
	onClose: () => void;
}

function HistoryRow({ entry, onClose }: HistoryRowProps) {
	const { updateCurrentConnection, updateQueryTab, addQueryTab } = useConfigStore.getState();
	const { showContextMenu } = useContextMenu();

	const isLight = useIsLight();
	const connection = useActiveConnection();
	const activeTab = useActiveQuery();

	const handleUseQuery = useStable(() => {
		onClose();
		addQueryTab({
			query: entry.query
		});
	});

	const handleReplaceQuery = useStable(() => {
		onClose();
		updateQueryTab({
			id: activeTab!.id,
			query: entry.query
		});
	});

	const handleDeleteQuery = useStable(() => {
		updateCurrentConnection({
			queryHistory: connection.queryHistory.filter((item) => item !== entry)
		});
	});

	return (
		<Box
			className={classes.query}
			onContextMenu={showContextMenu([
				{
					key: 'open',
					title: 'Open in new tab',
					icon: <Icon path={iconQuery} />,
					onClick: () => handleUseQuery(),
				},
				{
					key: 'replace',
					title: 'Open in current tab',
					icon: <Icon path={iconText} />,
					onClick: () => handleReplaceQuery(),
				},
				{
					key: 'remove',
					title: 'Remove query',
					color: '"pink.7',
					icon: <Icon path={iconDelete} />,
					onClick: () => handleDeleteQuery(),
				}
			])}
		>
			<Group h={28} wrap="nowrap">
				<Group gap="xs" wrap="nowrap" miw={0}>
					<Text c="bright" style={{ flexShrink: 0 }}>
						{capitalize(dayjs(entry.timestamp).fromNow())}
					</Text>
					{entry.origin && (
						<Text c="slate" truncate miw={0}>
							from {entry.origin}
						</Text>
					)}
				</Group>
				<Spacer />
				<Tooltip label="Open in new tab">
					<ActionIcon
						component="div"
						variant="gradient"
						className={classes.queryAction}
						onClick={handleUseQuery}
						aria-label="Open query in new tab"
					>
						<Icon path={iconQuery} size={0.9} />
					</ActionIcon>
				</Tooltip>
			</Group>

			<CodePreview
				mt="xs"
				value={entry.query}
			/>

			<Divider mt="md" color="slate.6" />
		</Box>
	);
}

export interface HistoryDrawerProps {
	opened: boolean;
	onClose: () => void;
}

export function HistoryDrawer(props: HistoryDrawerProps) {
	const { updateCurrentConnection } = useConfigStore.getState();

	const connection = useActiveConnection();
	const [filterText, setFilterText] = useInputState("");

	const clearHistory = useStable(() => {
		updateCurrentConnection({
			queryHistory: []
		});
	});

	const filtered = useMemo(() => {
		if (!connection) return [];

		const needle = filterText.toLowerCase();

		return connection.queryHistory.filter((entry) =>
			entry.query.toLowerCase().includes(needle)
		).reverse();
	}, [connection?.queryHistory, filterText]);

	return (
		<Drawer
			opened={props.opened}
			onClose={props.onClose}
			position="right"
			trapFocus={false}
		>
			<Group mb="md" gap="sm">
				<ModalTitle>
					Query history
				</ModalTitle>

				<Spacer />

				<ActionIcon
					onClick={clearHistory}
					title="Clear history"
					aria-label="Clear query history"
				>
					<Icon path={iconDelete} />
				</ActionIcon>

				<ActionIcon
					onClick={props.onClose}
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
					onChange={setFilterText}
				/>

				{filtered.length === 0 && (
					<Text ta="center" mt="sm" c="slate">
						No queries to display
					</Text>
				)}

				{filtered.map((entry, i) => (
					<HistoryRow
						key={i}
						entry={entry}
						onClose={props.onClose}
					/>
				))}
			</Stack>
		</Drawer>
	);
}