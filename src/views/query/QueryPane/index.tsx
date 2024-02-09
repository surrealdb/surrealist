import { editor } from "monaco-editor";
import { mdiDatabase, mdiFileDocument, mdiSendVariant, mdiStar, mdiText, mdiTuneVariant } from "@mdi/js";
import { useStable } from "~/hooks/stable";
import { useActiveQuery } from "~/hooks/connection";
import { Panel } from "~/components/Panel";
import { useRef } from "react";
import { configureQueryEditor, updateQueryValidation } from "~/util/editor";
import { useDebouncedCallback } from "~/hooks/debounce";
import { SurrealistEditor } from "~/components/SurrealistEditor";
import { ActionIcon, Badge, Box, Button, Divider, Group } from "@mantine/core";
import { useConfigStore } from '~/stores/config';
import { Icon } from "~/components/Icon";
import { adapter, isEmbed } from "~/adapter";
import { SURQL_FILTERS } from "~/constants";
import { Spacer } from "~/components/Spacer";
import { executeQuery } from "~/database";

export interface QueryPaneProps {
	showVariables: boolean;
	canQuery: boolean;
	isValid: boolean;
	openVariables: () => void;
	setIsValid: (isValid: boolean) => void;
}

export function QueryPane(props: QueryPaneProps) {
	const updateQueryTab = useConfigStore((s) => s.updateQueryTab);
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
							{!isEmbed && (
								<>
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
								</>
							)}

							<Spacer />

							{!props.showVariables && (
								<Button
									size="xs"
									onClick={props.openVariables}
									variant="light"
									color="surreal"
									leftSection={
										<Icon path={mdiTuneVariant} />
									}
								>
									Show variables
								</Button>
							)}

							<Button
								size="xs"
								onClick={runQuery}
								color={props.canQuery ? "surreal" : "red"}
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
