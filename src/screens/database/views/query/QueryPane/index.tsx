import {
	runQueryKeymap,
	selectionChanged,
	surqlCustomFunctionCompletion,
	surqlLinting,
	surqlRecordLinks,
	surqlTableCompletion,
	surqlVariableCompletion,
} from "~/editor";

import { Prec, type SelectionRange } from "@codemirror/state";
import { type EditorView, keymap, lineNumbers } from "@codemirror/view";
import { ActionIcon, Group, Stack, Tooltip } from "@mantine/core";
import { Text } from "@mantine/core";
import { surrealql } from "@surrealdb/codemirror";
import { type HtmlPortalNode, OutPortal } from "react-reverse-portal";
import { adapter } from "~/adapter";
import { MiniAdapter } from "~/adapter/mini";
import { CodeEditor } from "~/components/CodeEditor";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { useDebouncedFunction } from "~/hooks/debounce";
import { useStable } from "~/hooks/stable";
import { useIntent } from "~/hooks/url";
import { useInspector } from "~/providers/Inspector";
import { useConfigStore } from "~/stores/config";
import type { TabQuery } from "~/types";
import { extractVariables, showError, tryParseParams } from "~/util/helpers";
import { iconAutoFix, iconDollar, iconServer, iconStar, iconText } from "~/util/icons";
import { formatQuery, formatValue, validateQuery } from "~/util/surrealql";

export interface QueryPaneProps {
	activeTab: TabQuery;
	showVariables: boolean;
	switchPortal?: HtmlPortalNode<any>;
	selection: SelectionRange | undefined;
	corners?: string;
	setIsValid: (isValid: boolean) => void;
	setShowVariables: (show: boolean) => void;
	onSaveQuery: () => void;
	onSelectionChange: (value: SelectionRange) => void;
	onEditorMounted: (editor: EditorView) => void;
}

export function QueryPane({
	activeTab,
	showVariables,
	setIsValid,
	selection,
	switchPortal,
	setShowVariables,
	corners,
	onSaveQuery,
	onSelectionChange,
	onEditorMounted,
}: QueryPaneProps) {
	const { updateQueryTab } = useConfigStore.getState();
	const { inspect } = useInspector();

	const setQueryForced = useStable((query: string) => {
		setIsValid(!validateQuery(query));
		updateQueryTab({
			id: activeTab.id,
			query,
		});
	});

	const scheduleSetQuery = useDebouncedFunction(setQueryForced, 50);

	const handleFormat = useStable(() => {
		try {
			const query = hasSelection
				? activeTab.query.slice(0, selection.from) +
					formatQuery(activeTab.query.slice(selection.from, selection.to)) +
					activeTab.query.slice(selection.to)
				: formatQuery(activeTab.query);

			updateQueryTab({
				id: activeTab.id,
				query,
			});
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

		const query = activeTab.query;
		const currentVars = tryParseParams(activeTab.variables);
		const currentKeys = Object.keys(currentVars);
		const variables = extractVariables(query).filter((v) => !currentKeys.includes(v));

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

	const hideLineNumbers = adapter instanceof MiniAdapter && adapter.nonumbers;
	const setSelection = useDebouncedFunction(onSelectionChange, 50);
	const hasSelection = selection?.empty === false;

	useIntent("format-query", handleFormat);
	useIntent("infer-variables", inferVariables);

	return (
		<ContentPane
			title="Query"
			icon={iconServer}
			radius={corners}
			rightSection={
				switchPortal ? (
					<OutPortal node={switchPortal} />
				) : (
					<Group gap="sm">
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
				value={activeTab.query}
				onChange={scheduleSetQuery}
				historyKey={activeTab.id}
				onMount={onEditorMounted}
				extensions={[
					surrealql(),
					surqlLinting(),
					surqlRecordLinks(inspect),
					surqlTableCompletion(),
					surqlVariableCompletion(resolveVariables),
					surqlCustomFunctionCompletion(),
					selectionChanged(setSelection),
					Prec.high(keymap.of(runQueryKeymap)),
					hideLineNumbers ? [] : lineNumbers(),
				]}
			/>
		</ContentPane>
	);
}
