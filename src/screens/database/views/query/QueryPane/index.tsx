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

import { Prec, type SelectionRange } from "@codemirror/state";
import { type EditorView, keymap } from "@codemirror/view";
import { ActionIcon, Group, HoverCard, Stack, ThemeIcon, Tooltip } from "@mantine/core";
import { Text } from "@mantine/core";
import { surrealql } from "@surrealdb/codemirror";
import { useLayoutEffect } from "react";
import { type HtmlPortalNode, OutPortal } from "react-reverse-portal";
import { ActionButton } from "~/components/ActionButton";
import { CodeEditor } from "~/components/CodeEditor";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { MAX_HISTORY_QUERY_LENGTH } from "~/constants";
import { useActiveConnection } from "~/hooks/connection";
import { useDebouncedFunction } from "~/hooks/debounce";
import { useStable } from "~/hooks/stable";
import { useIntent } from "~/hooks/url";
import { useInspector } from "~/providers/Inspector";
import { useConfigStore } from "~/stores/config";
import { useQueryStore } from "~/stores/query";
import type { QueryTab } from "~/types";
import { extractVariables, showError, tryParseParams } from "~/util/helpers";
import { formatQuery, formatValue } from "~/util/surrealql";
import { readQuery } from "../QueryView/strategy";

export interface QueryPaneProps {
	activeTab: QueryTab;
	showVariables: boolean;
	switchPortal?: HtmlPortalNode<any>;
	selection: SelectionRange | undefined;
	lineNumbers: boolean;
	corners?: string;
	setShowVariables: (show: boolean) => void;
	onUpdateBuffer: (query: string) => void;
	onSaveQuery: () => void;
	onSelectionChange: (value: SelectionRange) => void;
	onEditorMounted: (editor: EditorView) => void;
}

export function QueryPane({
	activeTab,
	showVariables,
	selection,
	switchPortal,
	setShowVariables,
	lineNumbers,
	corners,
	onUpdateBuffer,
	onSaveQuery,
	onSelectionChange,
	onEditorMounted,
}: QueryPaneProps) {
	const { updateQueryTab, updateCurrentConnection } = useConfigStore.getState();
	const { inspect } = useInspector();
	const connection = useActiveConnection();

	const buffer = useQueryStore((s) => s.queryBuffer);

	const openQueryList = useStable(() => {
		updateCurrentConnection({
			queryTabList: true,
		});
	});

	const handleFormat = useStable(() => {
		try {
			const formatted = hasSelection
				? buffer.slice(0, selection.from) +
					formatQuery(buffer.slice(selection.from, selection.to)) +
					buffer.slice(selection.to)
				: formatQuery(buffer);

			onUpdateBuffer(formatted);
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

		const currentVars = tryParseParams(activeTab.variables);
		const currentKeys = Object.keys(currentVars);
		const variables = extractVariables(buffer).filter((v) => !currentKeys.includes(v));

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
			rightSection={
				switchPortal ? (
					<OutPortal node={switchPortal} />
				) : (
					<Group gap="sm">
						{buffer.length > MAX_HISTORY_QUERY_LENGTH && (
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
				value={buffer}
				onChange={onUpdateBuffer}
				historyKey={activeTab.id}
				onMount={onEditorMounted}
				lineNumbers={lineNumbers}
				extensions={[
					surrealql(),
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
