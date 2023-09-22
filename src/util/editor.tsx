import * as monaco from "monaco-editor";
import { KeyCode, KeyMod, editor, languages } from "monaco-editor";
import { actions, store } from "~/store";
import { SurrealInfoDB } from "~/typings/surreal";
import { getSurreal } from "./connection";
import onigasmPath from 'onigasm/lib/onigasm.wasm?url';
import { loadWASM } from 'onigasm';

import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

export const LIGHT_THEME = "surrealist-light";
export const DARK_THEME = "surrealist-dark";

const tablePrefixes = ["FROM ", "UPDATE ", "CREATE ", "DELETE ", "INTO "];

export const baseEditorConfig: editor.IStandaloneEditorConstructionOptions = {
	scrollBeyondLastLine: false,
	overviewRulerLanes: 0,
	fontFamily: "JetBrains Mono",
	renderLineHighlight: "none",
	lineDecorationsWidth: 12,
	lineNumbersMinChars: 1,
	glyphMargin: false,
	automaticLayout: true,
	minimap: {
		enabled: false,
	},
};

self.MonacoEnvironment = {
	getWorker: function (_workerId, label) {
		switch (label) {
			case 'json': {
				return new JsonWorker();
			}
			default: {
				return new EditorWorker();
			}
		}
	}
};

export async function initializeMonaco() {
	await loadWASM(onigasmPath);

	monaco.editor.defineTheme(LIGHT_THEME, {
		base: "vs",
		inherit: true,
		rules: [
			{ token: "keyword", foreground: "#e600a4" },
			{ token: "param", foreground: "#e67a15" },
			{ token: "comment", foreground: "#606475" },
			{ token: "fancy", foreground: "#09b8ac" },
			{ token: "function", foreground: "#9565cf" },
		],
		colors: {
			"editorLineNumber.foreground": "#9BA9C6",
			"editorLineNumber.activeForeground": "#465671",
		},
	});

	monaco.editor.defineTheme(DARK_THEME, {
		base: "vs-dark",
		inherit: true,
		rules: [
			{ token: "keyword", foreground: "#e600a4" },
			{ token: "param", foreground: "#e67a15" },
			{ token: "comment", foreground: "#606475" },
			{ token: "fancy", foreground: "#09b8ac" },
			{ token: "function", foreground: "#cb96ff" },
		],
		colors: {
			"editor.background": "#1a1b1e",
			"editorLineNumber.foreground": "#465671",
			"editorLineNumber.activeForeground": "#9BA9C6",
		},
	});

	console.log('register');

	monaco.languages.register({
		id: "surrealql",
		extensions: [".surql", ".surrealql"],
	});

	// monaco.languages.setMonarchTokensProvider("surrealql", {
	// 	ignoreCase: true,
	// 	keywords: KEYWORDS,
	// 	tokenizer: {
	// 		root: [
	// 			[/(count|(\w+::)+\w+)(?=\()/, "function"],
	// 			[/["'].*?["']/, "string"],
	// 			[/\/.*?[^\\]\/|<future>/, "fancy"],
	// 			[/(\/\/|#|--).+/, "comment"],
	// 			[/\$\w+/, "param"],
	// 			[
	// 				/\b\w+\b/,
	// 				{
	// 					cases: {
	// 						"@keywords": "keyword",
	// 						"@default": "variable",
	// 					},
	// 				},
	// 			],
	// 		],
	// 	},
	// });

	// table intellisense
	monaco.languages.registerCompletionItemProvider("surrealql", {
		triggerCharacters: [" "],
		provideCompletionItems: async (model, position, context) => {
			const { tableSuggest } = store.getState().config;
			const surreal = getSurreal();

			if (!tableSuggest || !surreal) {
				return;
			}

			const linePrefix = model.getLineContent(position.lineNumber).slice(0, Math.max(0, position.column));
			const isAuto = context.triggerKind === languages.CompletionTriggerKind.TriggerCharacter;

			if (isAuto && !tablePrefixes.some((pre) => linePrefix.toUpperCase().endsWith(pre))) {
				return;
			}

			try {
				const response = await surreal.querySingle("INFO FOR DB");
				const result = response[0].result as SurrealInfoDB;

				if (!result) {
					return {
						suggestions: [],
					};
				}

				const tables = Object.keys(result.tables);
				const suggestions = tables.map((table) => ({
					label: table,
					insertText: table,
					kind: languages.CompletionItemKind.Class,
					range: monaco.Range.fromPositions(position, position),
				}));

				return {
					suggestions,
				};
			} catch {
				return {
					suggestions: [],
				};
			}
		},
	});

	// variable intellisense
	monaco.languages.registerCompletionItemProvider("surrealql", {
		triggerCharacters: ["$"],
		provideCompletionItems(_, position, context) {
			const { config } = store.getState();
			const tab = config.tabs.find((tab) => tab.id == config.activeTab);

			if (!tab) {
				return;
			}

			const variables = JSON.parse(tab.variables);
			const variableNames = Object.keys(variables);

			if (variableNames.length === 0) {
				return;
			}

			const isAuto = context.triggerKind === languages.CompletionTriggerKind.TriggerCharacter;
			const suggestions: languages.CompletionItem[] = variableNames.map((variableName) => ({
				label: `$${variableName}`,
				insertText: (isAuto ? "" : "$") + variableName,
				detail: `${variables[variableName]}`,
				kind: languages.CompletionItemKind.Variable,
				range: monaco.Range.fromPositions(position, position),
			}));

			return {
				suggestions,
			};
		},
	});

	store.dispatch(actions.setMonacoLoaded());
}

/**
 * Configure an editor to run queries on Ctrl+Enter or F9
 * and support commenting with Ctrl+/
 *
 * @param editor The editor instance
 * @param onExecute The execute callback
 */
export function configureQueryEditor(editor: editor.IStandaloneCodeEditor, onExecute: () => void) {
	editor.addAction({
		id: "run-query",
		label: "Run Query",
		keybindings: [KeyMod.CtrlCmd | KeyCode.Enter, KeyCode.F9],
		run: () => onExecute(),
	});

	editor.addAction({
		id: "comment-query",
		label: "Comment Query",
		keybindings: [KeyMod.CtrlCmd | KeyCode.Slash],
		run: (editor) => {
			const selection = editor.getSelection();
			const model = editor.getModel();

			if (!selection || !model) {
				return;
			}

			const range = {
				startLineNumber: selection.startLineNumber,
				startColumn: 0,
				endLineNumber: selection.endLineNumber,
				endColumn: model.getLineMaxColumn(selection.endLineNumber),
			};

			const text = model.getValueInRange(range);
			const lines = text.split("\n");

			if (!lines) {
				return;
			}

			const hasComment = lines.some((line) => line.trim().startsWith("#"));

			const comment = lines
				.map((line) => {
					return hasComment ? line.replace(/^# /, "") : `# ${line}`;
				})
				.join("\n");

			editor.executeEdits("comment-query", [
				{
					range,
					text: comment,
				},
			]);
		},
	});
}
