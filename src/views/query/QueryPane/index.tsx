import { editor } from "monaco-editor";
import { mdiDatabase, mdiFileUpload, mdiStar, mdiText } from "@mdi/js";
import { useStable } from "~/hooks/stable";
import { useActiveQuery } from "~/hooks/connection";
import { ContentPane } from "~/components/Pane";
import { useRef } from "react";
import { configureQueryEditor, updateQueryValidation } from "~/util/editor";
import { useDebouncedCallback } from "~/hooks/debounce";
import { SurrealistEditor } from "~/components/SurrealistEditor";
import { ActionIcon, Badge, Box, Divider, Group } from "@mantine/core";
import { useConfigStore } from '~/stores/config';
import { Icon } from "~/components/Icon";
import { adapter, isEmbed } from "~/adapter";
import { SURQL_FILTERS } from "~/constants";
import { Spacer } from "~/components/Spacer";
import { Actions } from "../Actions";
import { format_query } from "~/generated/surrealist-embed";
import { getFileName, isUnnamedTab, showError } from "~/util/helpers";

export interface QueryPaneProps {
	showVariables: boolean;
	isValid: boolean;
	onSaveQuery: () => void;
	toggleVariables: () => void;
	setIsValid: (isValid: boolean) => void;
}

export function QueryPane(props: QueryPaneProps) {
	const { updateQueryTab } = useConfigStore.getState();

	const controls = useRef<editor.IStandaloneCodeEditor>();
	const activeTab = useActiveQuery();

	const validateQuery = useStable(() => {
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

	const handleUpload = useStable(async () => {
		if (!activeTab) return;

		const [file] = await adapter.openFile('Open query from file', SURQL_FILTERS, false);

		if (file) {
			setQueryForced(file.content);
			
			if (isUnnamedTab(activeTab)) {
				updateQueryTab({
					id: activeTab.id,
					name: getFileName(file.name)
				});
			}
		}
	});

	const handleFormat = useStable(() => {
		if (!activeTab) {
			return;
		}

		const formatted = format_query(activeTab.query);

		if (formatted) {
			setQueryForced(formatted);
		} else {
			showError('Formatting failed', 'Could not format query');
		}
	});

	return (
		<ContentPane
			title="Query"
			icon={mdiDatabase}
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
						noExpand
						language="surrealql"
						onMount={configure}
						value={activeTab.query}
						onChange={scheduleSetQuery}
						style={{
							position: "absolute",
							insetInline: 14,
							top: 0,
							bottom: isEmbed ? 0 : 54
						}}
						options={{
							quickSuggestions: false,
							wordBasedSuggestions: false,
							wrappingStrategy: "advanced",
							wordWrap: "on"
						}}
					/>
					{!isEmbed && (
						<Box
							style={{
								position: "absolute",
								insetInline: 12,
								bottom: 12
							}}
						>
							<Divider mb="sm" />
							<Group gap="sm">
								<ActionIcon
									onClick={props.onSaveQuery}
									title="Save query"
									variant="light"
								>
									<Icon path={mdiStar} />
								</ActionIcon>

								<ActionIcon
									onClick={handleFormat}
									title="Cleanup query"
									variant="light"
								>
									<Icon path={mdiText} />
								</ActionIcon>

								<ActionIcon
									onClick={handleUpload}
									title="Load from file"
									variant="light"
								>
									<Icon path={mdiFileUpload} />
								</ActionIcon>

								<Spacer />

								{!isEmbed && (
									<Actions
										queryTab={activeTab}
										showVariables={props.showVariables}
										toggleVariables={props.toggleVariables}
									/>
								)}
							</Group>
						</Box>
					)}
				</>
			)}
		</ContentPane>
	);
}
