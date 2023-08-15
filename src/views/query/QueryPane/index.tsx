import { Monaco } from "@monaco-editor/react";
import { editor, MarkerSeverity } from "monaco-editor";
import { mdiDatabase } from "@mdi/js";
import { useStable } from "~/hooks/stable";
import { useActiveTab } from "~/hooks/environment";
import { actions, store, useStoreValue } from "~/store";
import { updateConfig } from "~/util/helpers";
import { Panel } from "~/components/Panel";
import { useRef } from "react";
import { configureQueryEditor } from "~/util/editor";
import { useDebouncedCallback } from "~/hooks/debounce";
import { adapter } from "~/adapter";
import { SurrealistEditor } from "~/components/SurrealistEditor";

const ERR_REGEX = /Parse error on line (\d+) at character (\d+) when parsing '(.+)'/s;

export interface QueryPaneProps {
	onExecuteQuery: (override?: string) => void;
}

export function QueryPane(props: QueryPaneProps) {
	const activeTab = useActiveTab();
	const controls = useRef<[Monaco, editor.IStandaloneCodeEditor]>();
	const doErrorCheck = useStoreValue((state) => state.config.errorChecking);
	const fontZoomLevel = useStoreValue((state) => state.config.fontZoomLevel);

	if (!activeTab) {
		throw new Error("This should not happen");
	}

	const updateValidation = useStable(async () => {
		const [monaco, theEditor] = controls.current!;

		const model = theEditor.getModel()!;
		const content = model.getValue();
		const markers: editor.IMarkerData[] = [];

		if (content && doErrorCheck) {
			const message = (await adapter.validateQuery(content)) || "";
			const match = message.match(ERR_REGEX);

			if (match) {
				const lineNumber = Number.parseInt(match[1]);
				const column = Number.parseInt(match[2]);

				markers.push({
					startLineNumber: lineNumber,
					startColumn: column,
					endLineNumber: lineNumber,
					endColumn: column,
					message: message,
					severity: MarkerSeverity.Error,
				});
			}
		}

		monaco.editor.setModelMarkers(model, "owner", markers);
	});

	const setQuery = useDebouncedCallback(200, (content: string | undefined) => {
		store.dispatch(
			actions.updateTab({
				id: activeTab.id,
				query: content || "",
			})
		);

		updateConfig();
		updateValidation();
	});

	const configure = useStable((editor: editor.IStandaloneCodeEditor, root: Monaco) => {
		configureQueryEditor(editor, props.onExecuteQuery);

		controls.current = [root, editor];

		updateValidation();

		editor.addAction({
			id: "run-query-selection",
			label: "Execute Selection",
			contextMenuGroupId: "navigation",
			contextMenuOrder: 0,
			precondition: "editorHasSelection",
			run: () => {
				const sel = editor.getSelection();
				const model = editor.getModel();

				if (!sel || !model) {
					return;
				}

				props.onExecuteQuery(model.getValueInRange(sel));
			},
		});
	});

	return (
		<Panel title="Query" icon={mdiDatabase}>
			<SurrealistEditor
				language="surrealql"
				onMount={configure}
				value={activeTab?.query}
				onChange={setQuery}
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
