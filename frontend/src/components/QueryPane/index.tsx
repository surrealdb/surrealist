import { editor } from "monaco-editor";
import { mdiDatabase } from "@mdi/js";
import Editor from "@monaco-editor/react";
import { useStable } from "~/hooks/stable";
import { useActiveTab } from "~/hooks/tab";
import { actions, store } from "~/store";
import { updateConfig } from "~/util/helpers";
import { Panel } from "../Panel";
import { useMemo } from "react";

export function QueryPane() {
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
		// TODO
	});

	const options = useMemo<editor.IStandaloneEditorConstructionOptions>(() => {
		return {
			scrollBeyondLastLine: false,
			overviewRulerLanes: 0,
			fontFamily: 'JetBrains Mono',
			renderLineHighlight: 'none',
			lineDecorationsWidth: 12,
			lineNumbersMinChars: 1,
			glyphMargin: false,
			theme: 'surrealist',
			wordWrap: 'on',
			wrappingStrategy: 'advanced',
			automaticLayout: true,
			minimap: {
				enabled: false
			}
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