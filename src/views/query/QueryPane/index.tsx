import Editor from "@monaco-editor/react";
import {editor, KeyCode, KeyMod} from "monaco-editor";
import {mdiDatabase} from "@mdi/js";
import {useStable} from "~/hooks/stable";
import {useActiveTab} from "~/hooks/tab";
import {actions, store} from "~/store";
import {updateConfig} from "~/util/helpers";
import {Panel} from "~/components/Panel";
import {useMemo} from "react";
import {baseEditorConfig, configureQueryEditor} from "~/util/editor";
import {useIsLight} from "~/hooks/theme";
import { useDebouncedCallback } from "~/hooks/debounce";

export interface QueryPaneProps {
    isConnected: boolean;
    onExecuteQuery: (override?: string) => void;
}

export function QueryPane(props: QueryPaneProps) {
    const activeTab = useActiveTab();
    const isLight = useIsLight();

    if (!activeTab) {
        throw new Error('This should not happen');
    }

	const setQuery = useDebouncedCallback(200, (content: string | undefined) => {
		store.dispatch(actions.updateTab({
            id: activeTab.id,
            query: content || ''
        }));

        updateConfig();
	});

    const configure = useStable((editor: editor.IStandaloneCodeEditor) => {
		configureQueryEditor(editor, props.onExecuteQuery);
    
		editor.addAction({
			id: 'run-query-selection',
			label: 'Execute Selection',
			contextMenuGroupId: "navigation",
			contextMenuOrder: 0,
			precondition: 'editorHasSelection',
			run: () => {
				const sel = editor.getSelection();
				const model = editor.getModel()

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
        }
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
    )
}