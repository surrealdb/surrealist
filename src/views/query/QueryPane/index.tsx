import { editor } from "monaco-editor";
import { useStable } from "~/hooks/stable";
import { ContentPane } from "~/components/Pane";
import { useRef } from "react";
import { configureQueryEditor, updateQueryValidation } from "~/util/editor";
import { useDebouncedCallback } from "~/hooks/debounce";
import { SurrealistEditor } from "~/components/SurrealistEditor";
import { ActionIcon, Group, Tooltip } from "@mantine/core";
import { useConfigStore } from '~/stores/config';
import { iconServer, iconStar, iconText, iconTune } from "~/util/icons";
import { useFeatureFlags } from "~/util/feature-flags";
import { surql, surqlTableCompletion, surqlVariableCompletion } from "~/util/editor/extensions";
import { TabQuery } from "~/types";
import { Icon } from "~/components/Icon";
import { format_query, validate_query } from "~/generated/surrealist-embed";
import { showError } from "~/util/helpers";

export interface QueryPaneProps {
	activeTab: TabQuery;
	showVariables: boolean;
	setIsValid: (isValid: boolean) => void;
	setShowVariables: (show: boolean) => void;
	onSaveQuery: () => void;
}

export function QueryPane({
	activeTab,
	showVariables,
	setIsValid,
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

	return (
		<ContentPane
			title="Query"
			icon={iconServer}
			rightSection={
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

					{/* <Tooltip maw={175} multiline label={
						<>
							<Text>Infer variables from query</Text>
							<Text c="dimmed" size="sm">
								Automatically add missing variables to the editor
							</Text>
						</>
					}>
						<ActionIcon
							color="slate"
							onClick={() => {}}
						>
							<Icon path={iconAutoFix} />
						</ActionIcon>
					</Tooltip> */}

					<Tooltip label={showVariables ? "Hide variables" : "Show variables"}>
						<ActionIcon
							onClick={toggleVariables}
							variant="light"
						>
							<Icon path={iconTune} />
						</ActionIcon>
					</Tooltip>
				</Group>
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
