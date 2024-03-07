import { editor } from "monaco-editor";
import { useStable } from "~/hooks/stable";
import { ContentPane } from "~/components/Pane";
import { useRef } from "react";
import { configureQueryEditor, updateQueryValidation } from "~/util/editor";
import { useDebouncedCallback } from "~/hooks/debounce";
import { SurrealistEditor } from "~/components/SurrealistEditor";
import { Badge } from "@mantine/core";
import { useConfigStore } from '~/stores/config';
import { iconServer } from "~/util/icons";
import { useFeatureFlags } from "~/util/feature-flags";
import { surql, surqlTableCompletion, surqlVariableCompletion } from "~/util/editor/extensions";
import { TabQuery } from "~/types";

export interface QueryPaneProps {
	activeTab: TabQuery;
	isValid: boolean;
	setIsValid: (isValid: boolean) => void;
}

export function QueryPane({
	activeTab,
	isValid,
	setIsValid,
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
		validateQuery();
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

	return (
		<ContentPane
			title="Query"
			icon={iconServer}
			rightSection={
				!isValid && (
					<Badge
						color="red"
						variant="light"
					>
						Invalid query
					</Badge>
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
