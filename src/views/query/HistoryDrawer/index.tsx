import classes from "./style.module.scss";

import dayjs from "dayjs";
import { Stack, Text } from "@mantine/core";
import { Box, Button, Collapse, Drawer, Paper, SimpleGrid } from "@mantine/core";
import { useHover } from "@mantine/hooks";
import { mdiDelete, mdiLightningBolt } from "@mdi/js";
import { Icon } from "~/components/Icon";
import { ModalTitle } from "~/components/ModalTitle";
import { useActiveConnection } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";
import { HistoryQuery } from "~/types";

// import {
// 	ActionIcon,
// 	Box,
// 	Button,
// 	Collapse,
// 	Divider,
// 	Group,
// 	Paper,
// 	ScrollArea,
// 	SimpleGrid,
// 	Stack,
// 	Text,
// 	TextInput,
// 	useMantineTheme,
// } from "@mantine/core";

// import { mdiClose, mdiDelete, mdiHistory, mdiMagnify, mdiPencil, mdiPlay } from "@mdi/js";
// import { Fragment, useMemo } from "react";
// import { useIsLight } from "~/hooks/theme";
// import dayjs from "dayjs";
// import { useStable } from "~/hooks/stable";
// import { useHover, useInputState } from "@mantine/hooks";
// import { HistoryEntry } from "~/types";
// import { useActiveSession } from "~/hooks/environment";
// import { Panel } from "~/components/Panel";
// import { Icon } from "~/components/Icon";
// import { executeQuery } from "~/database";
// import { useConfigStore } from "~/stores/config";
// import { themeColor } from "~/util/mantine";

// export function HistoryPane() {
// 	const isLight = useIsLight();
// 	const activeSession = useActiveSession();
// 	const entries = useConfigStore((s) => s.queryHistory);
// 	const [search, setSearch] = useInputState("");

// 	const filtered = useMemo(() => {
// 		const needle = search.toLowerCase();

// 		return entries.filter((entry) => entry.query.toLowerCase().includes(needle));
// 	}, [search, entries]);

// 	const historyList = useMemo(() => {
// 		if (filtered.length === 0) {
// 			return (
// 				<Text ta="center" mt="sm">
// 					No results found
// 				</Text>
// 			);
// 		}

// 		return filtered.map((entry, i) => (
// 			<Fragment key={i}>
// 				<HistoryRow
// 					entry={entry}
// 					isLight={isLight}
// 				/>
// 				{i !== entries.length - 1 && <Divider color={isLight ? "light.0" : "dark.5"} />}
// 			</Fragment>
// 		));
// 	}, [activeSession, filtered, isLight]);

// 	return (
// 		<Panel title="History" icon={mdiHistory} rightSection={<HistoryActions />}>
// 			<ScrollArea
// 				style={{
// 					position: "absolute",
// 					inset: 12,
// 					top: 0,
// 				}}>
// 				<TextInput
// 					placeholder="Search history..."
// 					leftSection={<Icon path={mdiMagnify} />}
// 					value={search}
// 					onChange={setSearch}
// 					mb="lg"
// 				/>

// 				<Stack gap="sm">
// 					{historyList}
// 				</Stack>
// 			</ScrollArea>
// 		</Panel>
// 	);
// }

// function HistoryActions() {
// 	const setShowQueryListing = useConfigStore((s) => s.setShowQueryListing);
// 	const clearHistory = useConfigStore((s) => s.clearHistory);

// 	const emptyHistory = useStable(() => clearHistory());
// 	const hideHistory = useStable(() => setShowQueryListing(false));

// 	return (
// 		<Group align="center">
// 			<ActionIcon onClick={emptyHistory} title="Clear history">
// 				<Icon color="light.4" path={mdiDelete} />
// 			</ActionIcon>

// 			<ActionIcon onClick={hideHistory} title="Hide history">
// 				<Icon color="light.4" path={mdiClose} />
// 			</ActionIcon>
// 		</Group>
// 	);
// }

interface HistoryRowProps {
	entry: HistoryQuery;
}

function HistoryRow({ entry }: HistoryRowProps) {
	const { updateCurrentConnection, addQueryTab } = useConfigStore.getState();
	const { ref, hovered } = useHover();

	const executeHistory = useStable(() => {
		// 
	});

	const removeEntry = useStable(() => {
		// 
	});
	
	return (
		<Box
			ref={ref}
			// style={{ borderColor: themeColor(isLight ? "light.0" : "dark.3") }}
		>
			<Text mb={4}>
				{dayjs(entry.timestamp).fromNow()}
			</Text>

			<Paper withBorder mt="xs" p="xs">
				<Text
					ff="JetBrains Mono"
					className={classes.queryText}
					lineClamp={8}
					fw={600}
				>
					{entry.query}
				</Text>
			</Paper>

			<Collapse in={hovered}>
				<SimpleGrid cols={3} mt="xs" pb="xs" spacing="xs">
					<Button size="xs" variant="light" color="red" radius="sm" title="Remove" onClick={removeEntry}>
						<Icon path={mdiDelete} color="red" />
					</Button>
					<Button size="xs" variant="light" color="pink" radius="sm" title="Run query" onClick={executeHistory}>
						<Icon path={mdiLightningBolt} color="pink" />
					</Button>
				</SimpleGrid>
			</Collapse>
		</Box>
	);
}

export interface HistoryDrawerProps {
	opened: boolean;
	onClose: () => void;
}

export function HistoryDrawer(props: HistoryDrawerProps) {
	const connection = useActiveConnection();

	return (
		<Drawer
			opened={props.opened}
			onClose={props.onClose}
			position="right"
			title={<ModalTitle>Query history</ModalTitle>}
		>
			<Stack>
				{connection?.queryHistory?.map((entry, i) => (
					<HistoryRow
						key={i}
						entry={entry}
					/>
				))}
			</Stack>
		</Drawer>
	);
}