import { EditorView } from "@codemirror/view";
import {
	ActionIcon,
	Box,
	Divider,
	Drawer,
	Group,
	Menu,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import {
	Icon,
	iconClose,
	iconDelete,
	iconDotsVertical,
	iconQuery,
	iconSearch,
	iconText,
} from "@surrealdb/ui";
import dayjs from "dayjs";
import { capitalize } from "radash";
import { memo, useMemo } from "react";
import { ActionButton } from "~/components/ActionButton";
import { CodePreview } from "~/components/CodePreview";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { setEditorText } from "~/editor/helpers";
import { useConnection } from "~/hooks/connection";
import { useConnectionAndView } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";
import type { HistoryQuery } from "~/types";

const MAX_PREVIEW_LENGTH = 500;

interface HistoryRowProps {
	entry: HistoryQuery;
	editor: EditorView;
	history: HistoryQuery[];
	onClose: () => void;
}

function HistoryRow({ entry, editor, history, onClose }: HistoryRowProps) {
	const { updateConnection, addQueryTab } = useConfigStore.getState();
	const [connection] = useConnectionAndView();

	const handleUseQuery = useStable(() => {
		if (!connection) return;

		onClose();
		addQueryTab(connection, {
			type: "config",
			query: entry.query,
		});
	});

	const handleReplaceQuery = useStable(() => {
		onClose();
		setEditorText(editor, entry.query);
	});

	const handleDeleteQuery = useStable(() => {
		if (!connection) return;

		updateConnection({
			id: connection,
			queryHistory: history.filter((item) => item !== entry),
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
				language="surrealql"
			/>

			<Divider mt="md" />
		</Box>
	);
}

const HistoryRowLazy = memo(HistoryRow);

export interface HistoryDrawerProps {
	opened: boolean;
	editor: EditorView;
	onClose: () => void;
}

export function HistoryDrawer({ opened, editor, onClose }: HistoryDrawerProps) {
	const { updateConnection } = useConfigStore.getState();
	const [connection] = useConnectionAndView();
	const [filterText, setFilterText] = useInputState("");
	const history = useConnection((c) => c?.queryHistory ?? []);

	const clearHistory = useStable(() => {
		if (!connection) return;

		updateConnection({
			id: connection,
			queryHistory: [],
		});
	});

	const filtered = useMemo(() => {
		const needle = filterText.toLowerCase();

		return history.filter((entry) => entry.query.toLowerCase().includes(needle)).reverse();
	}, [history, filterText]);

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

				<ActionButton
					onClick={clearHistory}
					label="Clear history"
					color="red"
				>
					<Icon path={iconDelete} />
				</ActionButton>

				<ActionButton
					label="Close drawer"
					onClick={onClose}
				>
					<Icon path={iconClose} />
				</ActionButton>
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
						history={history}
						editor={editor}
						onClose={onClose}
					/>
				))}
			</Stack>
		</Drawer>
	);
}
