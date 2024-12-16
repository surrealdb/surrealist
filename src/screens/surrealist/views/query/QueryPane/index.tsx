import {
	runQueryKeymap,
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

import { historyField } from "@codemirror/commands";
import { EditorState, Prec, type SelectionRange } from "@codemirror/state";
import { type EditorView, keymap } from "@codemirror/view";
import { ActionIcon, Group, HoverCard, Stack, ThemeIcon, Tooltip } from "@mantine/core";
import { Text } from "@mantine/core";
import { surrealql } from "@surrealdb/codemirror";
import { trim } from "radash";
import { useMemo, useRef } from "react";
import { type HtmlPortalNode, OutPortal } from "react-reverse-portal";
import { ActionButton } from "~/components/ActionButton";
import { CodeEditor, StateSnapshot } from "~/components/CodeEditor";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { MAX_HISTORY_QUERY_LENGTH } from "~/constants";
import { setEditorText } from "~/editor/helpers";
import { useConnection } from "~/hooks/connection";
import { useDatabaseVersionLinter } from "~/hooks/editor";
import { useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useInspector } from "~/providers/Inspector";
import { useConfigStore } from "~/stores/config";
import { useQueryStore } from "~/stores/query";
import type { QueryTab } from "~/types";
import { extractVariables, showError, tryParseParams } from "~/util/helpers";
import { formatQuery, formatValue } from "~/util/surrealql";
import { readQuery, writeQuery } from "../QueryView/strategy";

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
	onSelectionChange: (value: SelectionRange | undefined) => void;
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
	const { updateQueryState, setQueryValid } = useQueryStore.getState();
	const { inspect } = useInspector();
	const queryTabList = useConnection((c) => c?.queryTabList);
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
	const updateState = useStable((query: string, snapshot: StateSnapshot, state: EditorState) => {
		const id = activeTab.id;
		const task = saveTasks.current.get(id);
		const selection = state.selection.main;
		const range = selection.empty ? undefined : selection;

		onSelectionChange(range);
		updateQueryState(activeTab.id, snapshot);
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

	const updateValid = useStable((status: string) => {
		setQueryValid(!status.length);
	});

	const hasSelection = selection?.empty === false;

	const extensions = useMemo(
		() => [
			surrealql(),
			surqlVersion,
			surqlLinting(updateValid),
			surqlRecordLinks(inspect),
			surqlTableCompletion(),
			surqlVariableCompletion(resolveVariables),
			surqlCustomFunctionCompletion(),
			Prec.high(keymap.of(runQueryKeymap)),
		],
		[inspect, surqlVersion],
	);

	useIntent("format-query", handleFormat);
	useIntent("infer-variables", inferVariables);

	return (
		<ContentPane
			title={activeTab.name ?? "Query"}
			icon={iconServer}
			radius={corners}
			leftSection={
				!queryTabList && (
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


						<ActionButton
							variant="light"
							label="Save query"
							onClick={onSaveQuery}
						>
							<Icon path={iconStar} />
						</ActionButton>

						<ActionButton
							variant="light"
							label={`Format ${hasSelection ? "selection" : "query"}`}
							onClick={handleFormat}
						>
							<Icon path={iconText} />
						</ActionButton>

						<ActionButton
							variant="light"
							label="Infer variables from query"
							description="Automatically add missing variables."
							onClick={inferVariables}
						>
							<Icon path={iconAutoFix} />
						</ActionButton>

						<ActionButton
							variant="light"
							label={showVariables ? "Hide variables" : "Show variables"}
							onClick={toggleVariables}
						>
							<Icon path={iconDollar} />
						</ActionButton>
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
				extensions={extensions}
			/>
		</ContentPane>
	);
}
