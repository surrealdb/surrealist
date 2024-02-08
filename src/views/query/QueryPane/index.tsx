import { editor } from "monaco-editor";
import { mdiDatabase, mdiFileDocument, mdiSendVariant, mdiStar, mdiText, mdiTuneVariant } from "@mdi/js";
import { useStable } from "~/hooks/stable";
import { useActiveQuery } from "~/hooks/connection";
import { Panel } from "~/components/Panel";
import { useRef } from "react";
import { configureQueryEditor, updateQueryValidation } from "~/util/editor";
import { useDebouncedCallback } from "~/hooks/debounce";
import { SurrealistEditor } from "~/components/SurrealistEditor";
import { ActionIcon, Box, Button, Divider, Group } from "@mantine/core";
import { useConfigStore } from '~/stores/config';
import { Icon } from "~/components/Icon";
import { adapter } from "~/adapter";
import { SURQL_FILTERS } from "~/constants";
import { Spacer } from "~/components/Spacer";
import { executeQuery } from "~/database";

export interface QueryPaneProps {
	showVariables: boolean;
	toggleVariables: () => void;
}

export function QueryPane(props: QueryPaneProps) {
	const updateQueryTab = useConfigStore((s) => s.updateQueryTab);
	const controls = useRef<editor.IStandaloneCodeEditor>();
	const activeTab = useActiveQuery();

	const setQueryForced = useStable((query: string) => {
		updateQueryTab({
			id: activeTab!.id,
			query
		});
	});

	const scheduleSetQuery = useDebouncedCallback(200, setQueryForced);

	const configure = useStable((editor: editor.IStandaloneCodeEditor) => {
		configureQueryEditor(editor);
		updateQueryValidation(editor);

		controls.current = editor;

		editor.focus();
	});

	const handleUpload = useStable(async () => {
		const [file] = await adapter.openFile('Open query from file', SURQL_FILTERS, false);

		if (file) {
			setQueryForced(file.content);
		}
	});

	const runQuery = useStable(() => {
		executeQuery();
	});

	return (
		<Panel
			title="Query"
			icon={mdiDatabase}
			rightSection={
				<Button
					size="xs"
					onClick={props.toggleVariables}
					variant="light"
					color={props.showVariables ? "slate" : "surreal"}
					leftSection={
						<Icon path={mdiTuneVariant} />
					}
				>
					{props.showVariables ? 'Hide' : 'Show'} variables
				</Button>
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
							bottom: 54
						}}
						options={{
							quickSuggestions: false,
							wordBasedSuggestions: false,
							wrappingStrategy: "advanced",
							wordWrap: "on"
						}}
					/>
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
								onClick={() => {}}
								title="Save query"
								variant="light"
							>
								<Icon color="light.4" path={mdiStar} />
							</ActionIcon>

							<ActionIcon
								onClick={() => {}}
								title="Format query"
								variant="light"
							>
								<Icon color="light.4" path={mdiText} />
							</ActionIcon>

							<ActionIcon
								onClick={handleUpload}
								title="Load from file"
								variant="light"
							>
								<Icon color="light.4" path={mdiFileDocument} />
							</ActionIcon>

							<Spacer />

							<Button
								size="xs"
								onClick={runQuery}
								rightSection={
									<Icon path={mdiSendVariant} />
								}
							>
								Run query
							</Button>
						</Group>
					</Box>
				</>
			)}
		</Panel>
	);
}
