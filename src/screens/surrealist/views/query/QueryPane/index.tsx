import { historyField } from "@codemirror/commands";
import { syntaxTree } from "@codemirror/language";
import { EditorState, Prec, type SelectionRange } from "@codemirror/state";
import { type EditorView, keymap, scrollPastEnd } from "@codemirror/view";
import { Button, Group, HoverCard, Paper, rem, Text, ThemeIcon, Transition } from "@mantine/core";
import { surrealql } from "@surrealdb/codemirror";
import { objectify, trim } from "radash";
import { useMemo, useRef, useState } from "react";
import { type HtmlPortalNode, OutPortal } from "react-reverse-portal";
import { ActionButton } from "~/components/ActionButton";
import { CodeEditor, StateSnapshot } from "~/components/CodeEditor";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { Spacer } from "~/components/Spacer";
import { MAX_HISTORY_QUERY_LENGTH } from "~/constants";
import {
	runQueryKeymap,
	surqlCustomFunctionCompletion,
	surqlLinting,
	surqlRecordLinks,
	surqlTableCompletion,
	surqlVariableCompletion,
} from "~/editor";
import { setEditorText } from "~/editor/helpers";
import { useSetting } from "~/hooks/config";
import { useConnection } from "~/hooks/connection";
import { useDatabaseVersionLinter } from "~/hooks/editor";
import { useConnectionAndView, useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useInspector } from "~/providers/Inspector";
import { getSurrealQL } from "~/screens/surrealist/connection/connection";
import { useConfigStore } from "~/stores/config";
import { useQueryStore } from "~/stores/query";
import type { QueryTab } from "~/types";
import { showErrorNotification, tryParseParams } from "~/util/helpers";
import {
	iconAutoFix,
	iconChevronRight,
	iconDollar,
	iconServer,
	iconStar,
	iconText,
	iconWarning,
} from "~/util/icons";
import { dispatchIntent } from "~/util/intents";
import { parseVariables } from "~/util/language";
import { readQuery, writeQuery } from "../QueryView/strategy";
import classes from "./style.module.scss";

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
	const isLight = useIsLight();
	const { updateQueryTab, updateConnection } = useConfigStore.getState();
	const { updateQueryState, setQueryValid } = useQueryStore.getState();
	const { inspect } = useInspector();
	const [connection] = useConnectionAndView();
	const queryTabList = useConnection((c) => c?.queryTabList);
	const surqlVersion = useDatabaseVersionLinter(editor);
	const queryStateMap = useQueryStore((s) => s.queryState);
	const saveTasks = useRef<Map<string, any>>(new Map());
	const [executionHidden, setExecutionHidden] = useState(false);
	const [allowSelectionExecution] = useSetting("behavior", "querySelectionExecution");
	const [showSelectionExecutionWarning] = useSetting(
		"behavior",
		"querySelectionExecutionWarning",
	);

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
		if (!connection) return;

		updateConnection({
			id: connection,
			queryTabList: true,
		});
	});

	const handleFormat = useStable(async () => {
		if (!editor) return;

		try {
			const document = editor.state.doc;
			const formatted = hasSelection
				? document.sliceString(0, selection.from) +
					(await getSurrealQL().formatQuery(
						document.sliceString(selection.from, selection.to),
					)) +
					document.sliceString(selection.to)
				: await getSurrealQL().formatQuery(document.toString());

			setEditorText(editor, formatted);
		} catch {
			showErrorNotification({
				title: "Failed to format",
				content: "Your query must be valid to format it",
			});
		}
	});

	const toggleVariables = useStable(() => {
		setShowVariables(!showVariables);
	});

	const inferVariables = useStable(async () => {
		if (!activeTab || !connection) return;

		const tree = syntaxTree(editor.state);
		const discovered = parseVariables(tree, (from, to) => editor.state.sliceDoc(from, to));
		const currentVars = tryParseParams(activeTab.variables);

		const newVars = objectify(
			discovered,
			(v) => v,
			(v) => currentVars[v] ?? "",
		);

		const mergedVars = {
			...currentVars,
			...newVars,
		};
		-setShowVariables(true);
		updateQueryTab(connection, {
			id: activeTab.id,
			variables: await getSurrealQL().formatValue(mergedVars, false, true),
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
			scrollPastEnd(),
		],
		[inspect, surqlVersion],
	);

	useIntent("format-query", handleFormat);
	useIntent("infer-variables", inferVariables);

	return (
		<ContentPane
			title={activeTab.name || "Query"}
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
				className={classes.editor}
				mb={-9}
				autoCollapseDepth={0}
			/>
			<Transition
				transition="slide-up"
				mounted={
					showSelectionExecutionWarning &&
					allowSelectionExecution &&
					hasSelection &&
					!executionHidden
				}
			>
				{(style) => (
					<Paper
						p="xs"
						pl="md"
						variant="gradient"
						bg={
							isLight
								? "var(--mantine-color-slate-1)"
								: "var(--mantine-color-slate-6)"
						}
						withBorder={false}
						style={{
							...style,
							position: "absolute",
							bottom: rem(12),
							left: rem(12),
							right: rem(12),
							zIndex: 1,
						}}
					>
						<Group>
							<Icon path={iconWarning} />
							<Text>Only the highlighted selection will execute</Text>
							<Spacer />
							<Button
								size="compact-sm"
								variant="subtle"
								color="violet"
								onClick={() => setExecutionHidden(true)}
							>
								Hide Temporarily
							</Button>
							<Button
								size="compact-sm"
								variant="subtle"
								color="violet"
								onClick={() => {
									dispatchIntent("open-settings", {
										tab: "preferences",
										section: "query-selection-execution",
									});
								}}
							>
								Configure
							</Button>
						</Group>
					</Paper>
				)}
			</Transition>
		</ContentPane>
	);
}
