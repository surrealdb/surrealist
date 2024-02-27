import classes from "./style.module.scss";

import dayjs from "dayjs";
import { ActionIcon, Group, Stack, Text, TextInput, Tooltip } from "@mantine/core";
import { Box, Drawer, Paper } from "@mantine/core";
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
					color: 'red',
					icon: <Icon path={iconDelete} />,
					onClick: () => handleDeleteQuery(),
				}
			])}
		>
			<Group h={28} mb="sm">
				<Box>
					{entry.origin && (
						<Text size="xs" c="slate">
							{entry.origin}
						</Text>
					)}
					<Text>
						Executed {dayjs(entry.timestamp).fromNow()}
					</Text>
				</Box>
				<Spacer />
				<Tooltip
					position="top"
					label="Open in new tab"
					offset={10}
					transitionProps={{ transition: "pop" }}
					openDelay={250}
				>
					<ActionIcon
						component="div"
						className={classes.queryAction}
						onClick={handleUseQuery}
					>
						<Icon path={iconQuery} size={0.9} />
					</ActionIcon>
				</Tooltip>
			</Group>

			<Paper mt="xs" p="xs" bg={isLight ? 'slate.1' : 'slate.9'}>
				<Text
					ff="JetBrains Mono"
					className={classes.queryText}
					lineClamp={8}
					fw={600}
				>
					{entry.query}
				</Text>
			</Paper>
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

				{/* <Badge
					color={isLight ? "slate.0" : "slate.9"}
					radius="sm"
					c="inherit"
				>
					{connection?.queryHistory?.length?.toString()}
				</Badge> */}

				<Spacer />

				<ActionIcon onClick={clearHistory} title="Clear history">
					<Icon path={iconDelete} />
				</ActionIcon>

				<ActionIcon onClick={props.onClose}>
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