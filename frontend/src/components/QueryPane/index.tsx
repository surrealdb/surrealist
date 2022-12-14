import { editor, KeyCode, KeyMod } from "monaco-editor";
import { mdiDatabase } from "@mdi/js";
import Editor from "@monaco-editor/react";
import { useStable } from "~/hooks/stable";
import { useActiveTab } from "~/hooks/tab";
import { actions, store } from "~/store";
import { updateConfig } from "~/util/helpers";
import { Panel } from "../Panel";
import { useMemo } from "react";
import { baseEditorConfig } from "~/util/editor";

export interface QueryPaneProps {
	onExecuteQuery: () => void;
}

export function QueryPane(props: QueryPaneProps) {
	const activeTab = useActiveTab();

	if (!activeTab) {
		throw new Error('This should not happen');
	}

	const setQuery = useStable((content: string|undefined) => {
		store.dispatch(actions.updateTab({
			id: activeTab.id,
			query: content || ''
		}));

		updateConfig();
	});

	const setEditor = useStable((editor: editor.IStandaloneCodeEditor) => {
		editor.addAction({
			id: 'run-query',
			label: 'Run Query',
			keybindings: [
				KeyMod.CtrlCmd | KeyCode.Enter
			],
			run: () => {
				props.onExecuteQuery();
			}
		})

	});

	const options = useMemo<editor.IStandaloneEditorConstructionOptions>(() => {
		return {
			...baseEditorConfig,
			wrappingStrategy: 'advanced',
			wordWrap: 'on',
		}
	}, []);

	return (
		<Panel title="Query" icon={mdiDatabase}>
			<div
				style={{
					position: 'absolute',
					insetBlock: 0,
					insetInline: 24
				}}
			>
				<Editor
					onMount={setEditor}
					value={activeTab?.query}
					onChange={setQuery}
					options={options}
					theme="surrealist"
					language="surrealql"
				/>
			</div>
		</Panel>
	)
}