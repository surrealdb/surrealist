import { useStable } from "~/hooks/stable";
import { ContentPane } from "~/components/Pane";
import { useDebouncedFunction } from "~/hooks/debounce";
import { CodeEditor } from "~/components/CodeEditor";
import { ActionIcon, Group, Stack, Tooltip } from "@mantine/core";
import { useConfigStore } from '~/stores/config';
import { iconAutoFix, iconDollar, iconServer, iconStar, iconText } from "~/util/icons";
import { selectionChanged, surqlTableCompletion, surqlVariableCompletion, surqlLinting, surqlCustomFunctionCompletion, surqlRecordLinks } from "~/util/editor/extensions";
import { TabQuery } from "~/types";
import { Icon } from "~/components/Icon";
import { extractVariables, showError, tryParseParams } from "~/util/helpers";
import { Text } from "@mantine/core";
import { HtmlPortalNode, OutPortal } from "react-reverse-portal";
import { SelectionRange } from "@codemirror/state";
import { useIntent } from "~/hooks/url";
import { formatQuery, formatValue, validateQuery } from "~/util/surrealql";
import { surrealql } from "@surrealdb/codemirror";
import { useInspector } from "~/providers/Inspector";
import { lineNumbers } from "@codemirror/view";

export interface QueryPaneProps {
	activeTab: TabQuery;
	showVariables: boolean;
	switchPortal?: HtmlPortalNode<any>;
	selection: SelectionRange | undefined;
	square?: boolean;
	setIsValid: (isValid: boolean) => void;
	setShowVariables: (show: boolean) => void;
	onSaveQuery: () => void;
	onSelectionChange: (value: SelectionRange) => void;
}

export function QueryPane({
	activeTab,
	showVariables,
	setIsValid,
	selection,
	switchPortal,
	setShowVariables,
	square,
	onSaveQuery,
	onSelectionChange,
}: QueryPaneProps) {
	const { updateQueryTab } = useConfigStore.getState();
	const { inspect } = useInspector();

	const setQueryForced = useStable((query: string) => {
		setIsValid(!validateQuery(query));
		updateQueryTab({
			id: activeTab.id,
			query
		});
	});

	const scheduleSetQuery = useDebouncedFunction(setQueryForced, 50);

	const handleFormat = useStable(() => {
		try {
			const query = hasSelection
				? activeTab.query.slice(0, selection.from)
					+ formatQuery(activeTab.query.slice(selection.from, selection.to))
					+ activeTab.query.slice(selection.to)
				: formatQuery(activeTab.query);

			updateQueryTab({
				id : activeTab.id,
				query
			});
		} catch {
			showError({
				title: "Failed to format",
				subtitle: "Your query must be valid to format it"
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

		const newVars = variables.reduce((acc, v) => {
			acc[v] = "";
			return acc;
		}, {} as Record<string, any>);

		const mergedVars = {
			...currentVars,
			...newVars
		};

		setShowVariables(true);
		updateQueryTab({
			id: activeTab.id,
			variables: formatValue(mergedVars, false, true),
		});
	});

	const setSelection = useDebouncedFunction(onSelectionChange, 50);
	const hasSelection = selection?.empty === false;

	useIntent("format-query", handleFormat);
	useIntent("infer-variables", inferVariables);

	return (
		<ContentPane
			title="Query"
			icon={iconServer}
			radius={square ? 0 : undefined}
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

						<Tooltip maw={175} multiline label={
							<Stack gap={4}>
								<Text>Infer variables from query</Text>
								<Text c="dimmed" size="sm">
									Automatically add missing variables.
								</Text>
							</Stack>
						}>
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
				extensions={[
					surrealql(),
					surqlLinting(),
					surqlRecordLinks(inspect),
					surqlTableCompletion(),
					surqlVariableCompletion(),
					surqlCustomFunctionCompletion(),
					selectionChanged(setSelection),
					lineNumbers(),
				]}
			/>
		</ContentPane>
	);
}
