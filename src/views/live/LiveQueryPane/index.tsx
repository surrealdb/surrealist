import { editor } from "monaco-editor";
import { mdiDatabase, mdiUpload } from "@mdi/js";
import { useStable } from "~/hooks/stable";
import { useActiveTab } from "~/hooks/environment";
import { actions, store, useStoreValue } from "~/store";
import { updateConfig } from "~/util/helpers";
import { Panel } from "~/components/Panel";
import { useRef } from "react";
import { configureQueryEditor, updateQueryValidation } from "~/util/editor";
import { useDebouncedCallback } from "~/hooks/debounce";
import { SurrealistEditor } from "~/components/SurrealistEditor";
import { ActionIcon } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { adapter } from "~/adapter";
import { SURQL_FILTERS } from "~/constants";

export function LiveQueryPane() {
	const activeTab = useActiveTab();
	const editorRef = useRef<editor.IStandaloneCodeEditor>();
	const fontZoomLevel = useStoreValue((state) => state.config.fontZoomLevel);

	const setQuery = useStable((content: string | undefined) => {
		if (!activeTab) {
			return;
		}

		store.dispatch(
			actions.updateTab({
				id: activeTab.id,
				query: content || "",
			})
		);

		updateConfig();
		updateQueryValidation(editorRef.current!);
	});

	const scheduleSetQuery = useDebouncedCallback(200, setQuery);

	const configure = useStable((editor: editor.IStandaloneCodeEditor) => {
		configureQueryEditor(editor);
		updateQueryValidation(editor);

		editorRef.current = editor;
	});

	const handleUpload = useStable(async () => {
		const query = await adapter.openFile('Load query from file', SURQL_FILTERS, false);

		if (typeof query == 'string') {
			setQuery(query);
		}
	});

	return (
		<Panel
			title="Live Query"
			icon={mdiDatabase}
			rightSection={
				<ActionIcon onClick={handleUpload} title="Load from file">
					<Icon color="light.4" path={mdiUpload} />
				</ActionIcon>
			}
		>
			<SurrealistEditor
				language="surrealql"
				onMount={configure}
				value={activeTab?.query}
				onChange={scheduleSetQuery}
				style={{
					position: "absolute",
					insetBlock: 0,
					insetInline: 24,
				}}
				options={{
					quickSuggestions: false,
					wordBasedSuggestions: false,
					wrappingStrategy: "advanced",
					wordWrap: "on",
					fontSize: 14 * fontZoomLevel,
				}}
			/>
		</Panel>
	);
}
