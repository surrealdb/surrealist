import classes from "./style.module.scss";

import {
	ActionIcon,
	Box,
	Button,
	Collapse,
	Divider,
	Group,
	Paper,
	ScrollArea,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
	useMantineTheme,
} from "@mantine/core";

import { mdiClose, mdiDelete, mdiHistory, mdiMagnify, mdiPencil, mdiPlay } from "@mdi/js";
import { Fragment, useMemo } from "react";
import { useIsLight } from "~/hooks/theme";
import dayjs from "dayjs";
import { useStable } from "~/hooks/stable";
import { useHover, useInputState } from "@mantine/hooks";
import { HistoryEntry } from "~/types";
import { useActiveSession } from "~/hooks/environment";
import { Panel } from "~/components/Panel";
import { Icon } from "~/components/Icon";
import { executeQuery } from "~/database";
import { useConfigStore } from "~/stores/config";
import { themeColor } from "~/util/mantine";

export function HistoryPane() {
	const isLight = useIsLight();
	const activeSession = useActiveSession();
	const entries = useConfigStore((s) => s.queryHistory);
	const [search, setSearch] = useInputState("");

	const filtered = useMemo(() => {
		const needle = search.toLowerCase();

		return entries.filter((entry) => entry.query.toLowerCase().includes(needle));
	}, [search, entries]);

	const historyList = useMemo(() => {
		if (filtered.length === 0) {
			return (
				<Text ta="center" mt="sm">
					No results found
				</Text>
			);
		}

		return filtered.map((entry, i) => (
			<Fragment key={i}>
				<HistoryRow
					entry={entry}
					isLight={isLight}
				/>
				{i !== entries.length - 1 && <Divider color={isLight ? "light.0" : "dark.5"} />}
			</Fragment>
		));
	}, [activeSession, filtered, isLight]);

	return (
		<Panel title="History" icon={mdiHistory} rightSection={<HistoryActions />}>
			<ScrollArea
				style={{
					position: "absolute",
					inset: 12,
					top: 0,
				}}>
				<TextInput
					placeholder="Search history..."
					leftSection={<Icon path={mdiMagnify} />}
					value={search}
					onChange={setSearch}
					mb="lg"
				/>

				<Stack gap="sm">
					{historyList}
				</Stack>
			</ScrollArea>
		</Panel>
	);
}

interface HistoryRowProps {
	entry: HistoryEntry;
	isLight: boolean;
}

function HistoryRow({ entry, isLight }: HistoryRowProps) {
	const removeHistoryEntry = useConfigStore((s) => s.removeHistoryEntry);
	const addQueryTab = useConfigStore((s) => s.addQueryTab);

	const theme = useMantineTheme();
	const { ref, hovered } = useHover();

	const removeEntry = useStable(() => removeHistoryEntry(entry.id));
	const editQuery = useStable(() => addQueryTab(entry.query));

	const executeHistory = useStable(() => {
		editQuery();

		setTimeout(executeQuery, 0);
	});

	return (
		<Box
			ref={ref}
			color={isLight ? "light.0" : "dark.4"}
			className={classes.entry}
			style={{ borderColor: themeColor(isLight ? "light.0" : "dark.3") }}>
			<Text c={isLight ? "light.3" : "light.4"} mb={4}>
				{dayjs(entry.timestamp).fromNow()}
			</Text>

			<Paper withBorder mt="xs" p="xs">
				<Text
					ff="JetBrains Mono"
					c={isLight ? "black" : "white"}
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
					<Button size="xs" variant="light" color="violet" radius="sm" title="Edit query" onClick={editQuery}>
						<Icon path={mdiPencil} color="violet" />
					</Button>
					<Button size="xs" variant="light" color="pink" radius="sm" title="Run query" onClick={executeHistory}>
						<Icon path={mdiPlay} color="pink" />
					</Button>
				</SimpleGrid>
			</Collapse>
		</Box>
	);
}

function HistoryActions() {
	const setShowQueryListing = useConfigStore((s) => s.setShowQueryListing);
	const clearHistory = useConfigStore((s) => s.clearHistory);

	const emptyHistory = useStable(() => clearHistory());
	const hideHistory = useStable(() => setShowQueryListing(false));

	return (
		<Group align="center">
			<ActionIcon onClick={emptyHistory} title="Clear history">
				<Icon color="light.4" path={mdiDelete} />
			</ActionIcon>

			<ActionIcon onClick={hideHistory} title="Hide history">
				<Icon color="light.4" path={mdiClose} />
			</ActionIcon>
		</Group>
	);
}
