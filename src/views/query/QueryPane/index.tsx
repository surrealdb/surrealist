import { editor } from "monaco-editor";
import { useStable } from "~/hooks/stable";
import { ContentPane } from "~/components/Pane";
import { useRef } from "react";
import { configureQueryEditor, updateQueryValidation } from "~/util/editor";
import { useDebouncedCallback } from "~/hooks/debounce";
import { SurrealistEditor } from "~/components/SurrealistEditor";
import { ActionIcon, Group, Tooltip } from "@mantine/core";
import { useConfigStore } from '~/stores/config';
import { iconAutoFix, iconServer, iconStar, iconText, iconTune } from "~/util/icons";
import { useFeatureFlags } from "~/util/feature-flags";
import { surql, surqlTableCompletion, surqlVariableCompletion } from "~/util/editor/extensions";
import { TabQuery } from "~/types";
import { Icon } from "~/components/Icon";
import { format_query, validate_query } from "~/generated/surrealist-embed";
import { showError, tryParseParams } from "~/util/helpers";
import { Text } from "@mantine/core";
import { HtmlPortalNode, OutPortal } from "react-reverse-portal";

const VARIABLE_PATTERN = /(?<!let\s)\$\w+/gi;

const RESERVED_VARIABLES = new Set([
	'auth',
	'token',
	'scope',
	'session',
	'before',
	'after',
	'value',
	'input',
	'this',
	'parent',
	'event',
]);

export interface QueryPaneProps {
	activeTab: TabQuery;
	showVariables: boolean;
	switchPortal?: HtmlPortalNode<any>;
	setIsValid: (isValid: boolean) => void;
	setShowVariables: (show: boolean) => void;
	onSaveQuery: () => void;
}

export function QueryPane({
	activeTab,
	showVariables,
	setIsValid,
	switchPortal,
	setShowVariables,
	onSaveQuery,
}: QueryPaneProps) {
	const { updateQueryTab } = useConfigStore.getState();

	const controls = useRef<editor.IStandaloneCodeEditor>();
	const [flags] = useFeatureFlags();

	const validateQuery = useStable(() => {
		if (flags.editor != "monaco") return;

		const isInvalid = updateQueryValidation(controls.current!);

		setIsValid(!isInvalid);
	});

	const setQueryForced = useStable((query: string) => {
		if (flags.editor === "monaco") {
			validateQuery();
		} else {
			const error = validate_query(query);

			setIsValid(!error);
		}

		updateQueryTab({
			id: activeTab.id,
			query
		});
	});

	const scheduleSetQuery = useDebouncedCallback(200, setQueryForced);

	const configure = useStable((editor: editor.IStandaloneCodeEditor) => {
		configureQueryEditor(editor);

		controls.current = editor;

		editor.focus();
		validateQuery();
	});

	const handleFormat = useStable(() => {
		const formatted = format_query(activeTab.query);

		if (formatted) {
			updateQueryTab({
				id : activeTab.id,
				query: formatted
			});
		} else {
			showError('Formatting failed', 'Could not format query');
		}
	});

	const toggleVariables = useStable(() => {
		setShowVariables(!showVariables);
	});

	const inferVariables = useStable(() => {
		if (!activeTab) return;

		const query = activeTab.query;
		const matches = query.match(VARIABLE_PATTERN) || [];

		const currentVars = tryParseParams(activeTab.variables);
		const currentKeys = Object.keys(currentVars);

		const variables = matches
			.map((v) => v.slice(1))
			.filter((v) => !RESERVED_VARIABLES.has(v) && !currentKeys.includes(v));

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
			variables: JSON.stringify(mergedVars, null, 4)
		});
	});

	return (
		<ContentPane
			title="Query"
			icon={iconServer}
			rightSection={
				switchPortal ? (
					<OutPortal node={switchPortal} />
				) : (
					<Group gap="sm">
						<Tooltip label="Save query">
							<ActionIcon
								onClick={onSaveQuery}
								variant="light"
							>
								<Icon path={iconStar} />
							</ActionIcon>
						</Tooltip>

						<Tooltip label="Format query">
							<ActionIcon
								onClick={handleFormat}
								variant="light"
							>
								<Icon path={iconText} />
							</ActionIcon>
						</Tooltip>

						<Tooltip maw={175} multiline label={
							<>
								<Text>Infer variables from query</Text>
								<Text c="dimmed" size="sm">
									Automatically add missing variables to the editor
								</Text>
							</>
						}>
							<ActionIcon
								color="slate"
								onClick={inferVariables}
							>
								<Icon path={iconAutoFix} />
							</ActionIcon>
						</Tooltip>

						<Tooltip label={showVariables ? "Hide variables" : "Show variables"}>
							<ActionIcon
								onClick={toggleVariables}
								variant="light"
							>
								<Icon path={iconTune} />
							</ActionIcon>
						</Tooltip>
					</Group>
				)
			}
		>
			<SurrealistEditor
				language="surrealql"
				onMount={configure}
				value={activeTab.query}
				onChange={scheduleSetQuery}
				options={{
					quickSuggestions: false,
					wordBasedSuggestions: false,
					wrappingStrategy: "advanced",
					wordWrap: "on",
				}}
				extensions={[
					surql(),
					surqlTableCompletion(),
					surqlVariableCompletion()
				]}
			/>
		</ContentPane>
	);
}
