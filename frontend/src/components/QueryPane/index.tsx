import { editor, KeyCode, KeyMod, languages } from "monaco-editor";
import { mdiDatabase } from "@mdi/js";
import Editor, { useMonaco } from "@monaco-editor/react";
import { useStable } from "~/hooks/stable";
import { useActiveTab } from "~/hooks/tab";
import { actions, store, useStoreValue } from "~/store";
import { updateConfig } from "~/util/helpers";
import { Panel } from "../Panel";
import { useMemo, useRef } from "react";
import { baseEditorConfig } from "~/util/editor";
import { useIsLight } from "~/hooks/theme";
import { Button } from "@mantine/core";
import { SurrealHandle } from "~/surreal";
import { useEffect } from "react";

export interface QueryPaneProps {
	surreal: SurrealHandle;
	isConnected: boolean;
	onExecuteQuery: () => void;
}

export function QueryPane(props: QueryPaneProps) {
	const monaco = useMonaco();
	const activeTab = useActiveTab();
	const isLight = useIsLight();
	
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
		});

		monaco!.languages.registerCompletionItemProvider('surrealql', {
			triggerCharacters: [' '],
			provideCompletionItems: async (model, position) => {
				const tableSuggest = store.getState().tableSuggest;

				if (!tableSuggest) {
					return undefined;
				}

				const linePrefix = model.getLineContent(position.lineNumber).substring(0, position.column);

				if (!linePrefix.toUpperCase().endsWith('FROM ')) {
					return undefined;
				}

				const response = await props.surreal.query('INFO FOR DB');
				const result = response[0].result;
				const tables = Object.keys(result.tb);

				const entries = tables.map(table => ({
					label: table,
					insertText: table,
					kind: languages.CompletionItemKind.Class,
					range: editor.getSelection()!
				}));

				return {
					suggestions: entries
				}
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
					onMount={setEditor}
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