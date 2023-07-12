import Editor, { Monaco } from "@monaco-editor/react";
import { editor, MarkerSeverity } from "monaco-editor";
import { mdiDatabase } from "@mdi/js";
import { useStable } from "~/hooks/stable";
import { useActiveTab } from "~/hooks/environment";
import { actions, store, useStoreValue } from "~/store";
import { updateConfig } from "~/util/helpers";
import { Panel } from "~/components/Panel";
import { useMemo, useRef } from "react";
import { baseEditorConfig, configureQueryEditor } from "~/util/editor";
import { useIsLight } from "~/hooks/theme";
import { useDebouncedCallback } from "~/hooks/debounce";
import { adapter } from "~/adapter";

const ERR_REGEX = /Parse error on line (\d+) at character (\d+) when parsing '(.+)'/s;
const ERR_CONTEXT = 3;

export interface QueryPaneProps {
	onExecuteQuery: (override?: string) => void;
}

export function QueryPane(props: QueryPaneProps) {
	const activeTab = useActiveTab();
	const isLight = useIsLight();
	const controls = useRef<[Monaco, editor.IStandaloneCodeEditor]>();
	const doErrorCheck = useStoreValue(state => state.config.errorChecking);

	if (!activeTab) {
		throw new Error('This should not happen');
	}

	const updateValidation = useStable(async () => {
		const [monaco, theEditor] = controls.current!;

		const model = theEditor.getModel()!;
		const content = model.getValue();
		const markers: editor.IMarkerData[] = [];

		if (content && doErrorCheck) {
			const message = await adapter.validateQuery(content) || '';
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
					severity: MarkerSeverity.Error
				});
			}
		}

		monaco.editor.setModelMarkers(model, 'owner', markers);
	});

	const setQuery = useDebouncedCallback(200, (content: string | undefined) => {
		store.dispatch(actions.updateTab({
			id: activeTab.id,
			query: content || ''
		}));

		updateConfig();
		updateValidation();
	});

	const configure = useStable((editor: editor.IStandaloneCodeEditor, root: Monaco) => {
		configureQueryEditor(editor, props.onExecuteQuery);

		controls.current = [root, editor];

		updateValidation();

		editor.addAction({
			id: 'run-query-selection',
			label: 'Execute Selection',
			contextMenuGroupId: "navigation",
			contextMenuOrder: 0,
			precondition: 'editorHasSelection',
			run: () => {
				const sel = editor.getSelection();
				const model = editor.getModel();

				if (!sel || !model) {
					return;
				}

				props.onExecuteQuery(model.getValueInRange(sel));
			}
		});
	});

	const options = useMemo<editor.IStandaloneEditorConstructionOptions>(() => {
		return {
			...baseEditorConfig,
			quickSuggestions: false,
			wordBasedSuggestions: false,
			wrappingStrategy: 'advanced',
			wordWrap: 'on',
		};
	}, []);

	return (
		<Panel
			title="Query"
			icon={mdiDatabase}
		>
			<div
				style={{
					position: 'absolute',
					insetBlock: 0,
					insetInline: 24
				}}
			>
				<Editor
					onMount={configure}
					theme={isLight ? 'surrealist' : 'surrealist-dark'}
					value={activeTab?.query}
					onChange={setQuery}
					options={options}
					language="surrealql"
				/>
			</div>
		</Panel>
	);
}