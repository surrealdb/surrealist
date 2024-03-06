import { editor } from "monaco-editor";
import { useStable } from "~/hooks/stable";
import { useActiveQuery } from "~/hooks/connection";
import { ContentPane } from "~/components/Pane";
import { useRef } from "react";
import { configureQueryEditor, updateQueryValidation } from "~/util/editor";
import { useDebouncedCallback } from "~/hooks/debounce";
import { SurrealistEditor } from "~/components/SurrealistEditor";
import { Badge, Divider, Group } from "@mantine/core";
import { useConfigStore } from '~/stores/config';
import { isEmbed } from "~/adapter";
import { Spacer } from "~/components/Spacer";
import { Actions } from "../Actions";
import { iconServer } from "~/util/icons";
import { useFeatureFlags } from "~/util/feature-flags";
import { surql, surqlTableCompletion, surqlVariableCompletion } from "~/util/editor/extensions";

export interface QueryPaneProps {
	showVariables: boolean;
	isValid: boolean;
	onSaveQuery: () => void;
	onToggleVariables: () => void;
	setIsValid: (isValid: boolean) => void;
}

export function QueryPane(props: QueryPaneProps) {
	const { updateQueryTab } = useConfigStore.getState();

	const controls = useRef<editor.IStandaloneCodeEditor>();
	const activeTab = useActiveQuery();
	const [flags] = useFeatureFlags();

	const validateQuery = useStable(() => {
		if (flags.editor != "monaco") return;

		const isInvalid = updateQueryValidation(controls.current!);

		props.setIsValid(!isInvalid);
	});

	const setQueryForced = useStable((query: string) => {
		validateQuery();
		updateQueryTab({
			id: activeTab!.id,
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

	// const handleUpload = useStable(async () => {
	// 	if (!activeTab) return;

	// 	const [file] = await adapter.openFile('Open query from file', SURQL_FILTERS, false);

	// 	if (file) {
	// 		setQueryForced(file.content);

	// 		if (isUnnamedTab(activeTab)) {
	// 			updateQueryTab({
	// 				id: activeTab.id,
	// 				name: getFileName(file.name)
	// 			});
	// 		}
	// 	}
	// });

	return (
		<ContentPane
			title="Query"
			icon={iconServer}
			rightSection={
				!props.isValid && (
					<Badge
						color="red"
						variant="light"
					>
						Invalid query
					</Badge>
				)
			}
		>
			{activeTab && (
				<>
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
					{!isEmbed && (
						<>
							<Divider mb="sm" />
							<Group gap="sm">
								<Spacer />

								{!isEmbed && (
									<Actions
										queryTab={activeTab}
										showVariables={props.showVariables}
										onToggleVariables={props.onToggleVariables}
										onSaveQuery={props.onSaveQuery}
									/>
								)}
							</Group>
						</>
					)}
				</>
			)}
		</ContentPane>
	);
}
