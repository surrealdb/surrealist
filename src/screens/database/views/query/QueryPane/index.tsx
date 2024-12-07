import {
	runQueryKeymap,
	selectionChanged,
	surqlCustomFunctionCompletion,
	surqlLinting,
	surqlRecordLinks,
	surqlTableCompletion,
	surqlVariableCompletion,
} from "~/editor";

import {
	iconAutoFix,
	iconChevronRight,
	iconDollar,
	iconServer,
	iconStar,
	iconText,
	iconWarning,
} from "~/util/icons";

import { EditorState, Prec, type SelectionRange } from "@codemirror/state";
import { type EditorView, keymap } from "@codemirror/view";
import { ActionIcon, Group, HoverCard, Stack, ThemeIcon, Tooltip } from "@mantine/core";
import { Text } from "@mantine/core";
import { surrealql } from "@surrealdb/codemirror";
import { trim } from "radash";
import { type HtmlPortalNode, OutPortal } from "react-reverse-portal";
import { ActionButton } from "~/components/ActionButton";
import { CodeEditor, StateSnapshot } from "~/components/CodeEditor";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { useActiveConnection } from "~/hooks/connection";
import { useDebouncedFunction } from "~/hooks/debounce";
import { useDatabaseVersionLinter } from "~/hooks/editor";
import { useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useInspector } from "~/providers/Inspector";
import { useConfigStore } from "~/stores/config";
import { useQueryStore } from "~/stores/query";
import type { QueryTab } from "~/types";
import { extractVariables, showError, tryParseParams } from "~/util/helpers";
import { formatQuery, formatValue } from "~/util/surrealql";
import { historyField } from "@codemirror/commands";
import { setEditorText } from "~/editor/helpers";
import { useMemo, useRef } from "react";
import { readQuery, writeQuery } from "../QueryView/strategy";
import { MAX_HISTORY_QUERY_LENGTH } from "~/constants";

const SERIALIZE = {
	history: historyField,
};

export interface QueryPaneProps {
	activeTab: QueryTab;
	editor: EditorView;
	showVariables: boolean;
	switchPortal?: HtmlPortalNode<any>;
	selection: SelectionRange | undefined;
	lineNumbers: boolean;
	corners?: string;
	setShowVariables: (show: boolean) => void;
	onSaveQuery: () => void;
	onSelectionChange: (value: SelectionRange) => void;
	onEditorMounted: (editor: EditorView) => void;
}

export function QueryPane({
	activeTab,
	editor,
	showVariables,
	selection,
	switchPortal,
	setShowVariables,
	lineNumbers,
	corners,
	onSaveQuery,
	onSelectionChange,
	onEditorMounted,
}: QueryPaneProps) {
	const { updateQueryTab, updateCurrentConnection } = useConfigStore.getState();
	const { updateQueryState } = useQueryStore.getState();
	const { inspect } = useInspector();
	const connection = useActiveConnection();
	const surqlVersion = useDatabaseVersionLinter(editor);
	const queryStateMap = useQueryStore((s) => s.queryState);
	const saveTasks = useRef<Map<string, any>>(new Map());

	// Retrieve a cached editor state, or compute when missing
	const queryState = useMemo(() => {
		const cache = queryStateMap[activeTab.id];

		if (cache) {
			return cache;
		}

		const state = EditorState.create().toJSON(SERIALIZE) as StateSnapshot;

		Promise.resolve(readQuery(activeTab)).then((query) => {
			updateQueryState(activeTab.id, EditorState.create({ doc: query }).toJSON(SERIALIZE));
		});

		return state;
	}, [queryStateMap, activeTab, updateQueryState]);

	// Cache the editor state and schedule query writing
	const updateState = useStable((query: string, state: StateSnapshot) => {
		const id = activeTab.id;
		const task = saveTasks.current.get(id);

		updateQueryState(activeTab.id, state);
		clearTimeout(task);

		const newTask = setTimeout(() => {
			saveTasks.current.delete(id);
			writeQuery(activeTab, query);
		}, 500);

		saveTasks.current.set(id, newTask);
	});

	const openQueryList = useStable(() => {
		updateCurrentConnection({
			queryTabList: true,
		});
	});

	const handleFormat = useStable(() => {
		if (!editor) return;

		try {
			const document = editor.state.doc;
			const formatted = hasSelection
				? document.sliceString(0, selection.from) +
					formatQuery(document.sliceString(selection.from, selection.to)) +
					document.sliceString(selection.to)
				: formatQuery(document.toString());

			setEditorText(editor, formatted);
		} catch {
			showError({
				title: "Failed to format",
				subtitle: "Your query must be valid to format it",
			});
		}
	});

	const toggleVariables = useStable(() => {
		setShowVariables(!showVariables);
	});

	const inferVariables = useStable(() => {
		if (!activeTab) return;

		const document = editor.state.doc;
		const currentVars = tryParseParams(activeTab.variables);
		const currentKeys = Object.keys(currentVars);
		const variables = extractVariables(document.toString()).filter(
			(v) => !currentKeys.includes(v),
		);

		const newVars = variables.reduce(
			(acc, v) => {
				acc[v] = "";
				return acc;
			},
			{} as Record<string, any>,
		);

		const mergedVars = {
			...currentVars,
			...newVars,
		};

		setShowVariables(true);
		updateQueryTab({
			id: activeTab.id,
			variables: formatValue(mergedVars, false, true),
		});
	});

	const resolveVariables = useStable(() => {
		return Object.keys(tryParseParams(activeTab.variables));
	});

	const setSelection = useDebouncedFunction(onSelectionChange, 50);
	const hasSelection = selection?.empty === false;

	useIntent("format-query", handleFormat);
	useIntent("infer-variables", inferVariables);

	return (
		<ContentPane
			title={activeTab.name ?? "Query"}
			icon={iconServer}
			radius={corners}
			leftSection={
				!connection.queryTabList && (
					<ActionButton
						label="Reveal queries"
						mr="sm"
						color="slate"
						variant="light"
						onClick={openQueryList}
					>
						<Icon path={iconChevronRight} />
					</ActionButton>
				)
			}
			infoSection={
				activeTab.type === "file" && (
					<Text
						c="slate"
						truncate
					>
						{trim(activeTab.query, "\\\\?")}
					</Text>
				)
			}
			rightSection={
				switchPortal ? (
					<OutPortal node={switchPortal} />
				) : (
					<Group
						gap="sm"
						style={{ flexShrink: 0 }}
					>
						{queryState.doc.length > MAX_HISTORY_QUERY_LENGTH && (
							<HoverCard position="bottom">
								<HoverCard.Target>
									<ThemeIcon
										radius="xs"
										variant="light"
										color="orange"
									>
										<Icon path={iconWarning} />
									</ThemeIcon>
								</HoverCard.Target>
								<HoverCard.Dropdown maw={225}>
									This query exceeds the maximum length to be saved in the query
									history.
								</HoverCard.Dropdown>
							</HoverCard>
						)}

						<Tooltip label="Save query">
							<ActionIcon
								onClick={onSaveQuery}
								variant="light"
								aria-label="Save query"
							>
								<Icon path={iconStar} />
							</ActionIcon>
						</Tooltip>

						<Tooltip label={`Format ${hasSelection ? "selection" : "query"}`}>
							<ActionIcon
								onClick={handleFormat}
								variant="light"
								aria-label={`Format ${hasSelection ? "selection" : "query"}`}
							>
								<Icon path={iconText} />
							</ActionIcon>
						</Tooltip>

						<Tooltip
							maw={175}
							multiline
							label={
								<Stack gap={4}>
									<Text>Infer variables from query</Text>
									<Text
										c="dimmed"
										size="sm"
									>
										Automatically add missing variables.
									</Text>
								</Stack>
							}
						>
							<ActionIcon
								onClick={inferVariables}
								variant="light"
								aria-label="Infer variables from query"
							>
								<Icon path={iconAutoFix} />
							</ActionIcon>
						</Tooltip>

						<Tooltip label={showVariables ? "Hide variables" : "Show variables"}>
							<ActionIcon
								onClick={toggleVariables}
								variant="light"
								aria-label={showVariables ? "Hide variables" : "Show variables"}
							>
								<Icon path={iconDollar} />
							</ActionIcon>
						</Tooltip>
					</Group>
				)
			}
		>
			<CodeEditor
				state={queryState}
				onChange={updateState}
				onMount={onEditorMounted}
				lineNumbers={lineNumbers}
				serialize={SERIALIZE}
				extensions={[
					surrealql(),
					surqlVersion,
					surqlLinting(),
					surqlRecordLinks(inspect),
					surqlTableCompletion(),
					surqlVariableCompletion(resolveVariables),
					surqlCustomFunctionCompletion(),
					selectionChanged(setSelection),
					Prec.high(keymap.of(runQueryKeymap)),
				]}
			/>
		</ContentPane>
	);
}
