import * as monaco from "monaco-editor";
import onigasmPath from 'onigasm/lib/onigasm.wasm?url';
import { getConnection } from "./connection";
import { KeyCode, KeyMod, editor, languages } from "monaco-editor";
import { SurrealInfoDB } from "~/typings/surreal";
import { getSurreal } from "./surreal";
import { loadWASM } from 'onigasm';
import { executeQuery } from "~/database";
import { validate_query } from "~/generated/surrealist-embed";

import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

import surrealqlTm from '~/assets/grammar/surrealql.tmLanguage.json';
import javascriptTm from '~/assets/grammar/javascript.tmLanguage.json';
import jsonTm from '~/assets/grammar/JSON.tmLanguage.json';

import surrealistLightTheme from '~/assets/themes/surrealist-light.json';
import surrealistDarkTheme from '~/assets/themes/surrealist-dark.json';
import { Registry } from "monaco-textmate";
import { wireTmGrammars } from "monaco-editor-textmate";
import { ColorScheme } from "~/types";
import { useInterfaceStore } from "~/stores/interface";
import { getSetting } from "./config";

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

export const LIGHT_THEME = "surrealist-light";
export const DARK_THEME = "surrealist-dark";

export const BASE_EDITOR_CONFIG: editor.IStandaloneEditorConstructionOptions = {
	scrollBeyondLastLine: false,
	overviewRulerLanes: 0,
	smoothScrolling: true,
	fontFamily: "JetBrains Mono",
	renderLineHighlight: "none",
	lineDecorationsWidth: 12,
	lineNumbersMinChars: 1,
	glyphMargin: false,
	automaticLayout: true,
	bracketPairColorizationOptions: {
		enabled: false
	},
	minimap: {
		enabled: false,
	},
	"bracketPairColorization.enabled": false, // NOTE Horrible hack (https://github.com/microsoft/monaco-editor/issues/3829)
} as any;

const ERR_REGEX = /Parse error: Failed to parse query at line (\d+) column (\d+)(.+)/s;
const TABLE_PREFIXES = ["FROM ", "UPDATE ", "CREATE ", "DELETE ", "INTO "];
const SCOPE_GRAMMARS: any = {
	'source.surql': {
		format: 'json',
		content: surrealqlTm,
	},
	'source.js': {
		format: 'json',
		content: javascriptTm
	},
	'source.json': {
		format: 'json',
		content: jsonTm
	}
};

const GRAMMAR_REGISTRY = new Registry({
	getGrammarDefinition: async (scopeName) => {
		return getGrammar(scopeName);
	}
});

const GRAMMARS_MAPPING = new Map([
	['surrealql', 'source.surql'],
	['javascript', 'source.js'],
	['json', 'source.json']
]);

export function getGrammar(scopeName: string) {
	return SCOPE_GRAMMARS[scopeName] || SCOPE_GRAMMARS['source.surql'];
}

export async function initializeMonaco() {
	await loadWASM(onigasmPath);

	monaco.editor.defineTheme(LIGHT_THEME, surrealistLightTheme as any);
	monaco.editor.defineTheme(DARK_THEME, surrealistDarkTheme as any);

	setEditorTheme(useInterfaceStore.getState().colorScheme);

	monaco.languages.register({
		id: "surrealql",
		extensions: [".surql", ".surrealql"],
	});

	monaco.languages.register({
		id: 'javascript',
		aliases: ['typescript', 'js']
	});

	monaco.languages.setLanguageConfiguration("surrealql", {
		comments: {
			lineComment: "--",
			blockComment: ["/*", "*/"]
		},
		brackets: [
			["{", "}"],
			["[", "]"],
			["(", ")"],
			["⟨", "⟩"],
			["`", "`"]
		],
		autoClosingPairs: [
			{ open: "{", close: "}", notIn: ["string", "comment"] },
			{ open: "[", close: "]", notIn: ["string", "comment"] },
			{ open: "(", close: ")", notIn: ["string", "comment"] },
			{ open: "\"", close: "\"", notIn: ["string"] },
			{ open: "'", close: "'", notIn: ["string"] },
			{ open: "`", close: "`", notIn: ["string"] },
			{ open: "⟨", close: "⟩", notIn: ["string", "comment"] }
		],
		surroundingPairs: [
			{ open: "{", close: "}" },
			{ open: "[", close: "]" },
			{ open: "(", close: ")" },
			{ open: "\"", close: "\"" },
			{ open: "'", close: "'" },
			{ open: "`", close: "`" },
			{ open: "⟨", close: "⟩" }
		]
	});

	// table intellisense
	monaco.languages.registerCompletionItemProvider("surrealql", {
		triggerCharacters: [" "],
		provideCompletionItems: async (model, position, context) => {
			const tableSuggest = getSetting("behavior", "tableSuggest");
			const surreal = getSurreal();

			if (!tableSuggest || !surreal) {
				return;
			}

			const linePrefix = model.getLineContent(position.lineNumber).slice(0, Math.max(0, position.column));
			const isAuto = context.triggerKind === languages.CompletionTriggerKind.TriggerCharacter;

			if (isAuto && !TABLE_PREFIXES.some((pre) => linePrefix.toUpperCase().endsWith(pre))) {
				return;
			}

			try {
				const response = await surreal.queryFirst("INFO FOR DB");
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
			const variableSuggest = getSetting("behavior", "variableSuggest");
			const connection = getConnection();
			const query = connection?.queries?.find((q) => q.id === connection?.activeQuery);

			if (!variableSuggest || !connection || !query) {
				return;
			}

			const variables = JSON.parse(query.variables || '{}');
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

	wireHighlighting();
}

/**
 * Configure font highlighting
 */
export function wireHighlighting() {
	wireTmGrammars(monaco, GRAMMAR_REGISTRY, GRAMMARS_MAPPING);

	document.fonts.ready.then(() => {
		monaco.editor.remeasureFonts();
	});
}

/**
 * Configure an editor to run queries on Ctrl+Enter or F9
 * and support commenting with Ctrl+/
 *
 * @param editor The editor instance
 */
export function configureQueryEditor(editor: editor.IStandaloneCodeEditor) {
	editor.addAction({
		id: "run-query",
		label: "Run Query",
		keybindings: [KeyMod.CtrlCmd | KeyCode.Enter, KeyCode.F9],
		run: () => executeQuery(),
	});

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

			executeQuery({
				override: model.getValueInRange(sel),
				loader: true
			});
		},
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

/**
 * Perform validation on the given query editor
 *
 * @param editor The editor instance
 * @returns Whether the query is valid
 */
export function updateQueryValidation(editor: editor.IStandaloneCodeEditor) {
	const queryErrorChecker = getSetting("behavior", "queryErrorChecker");

	const model = editor.getModel()!;
	const content = model.getValue();
	const markers: editor.IMarkerData[] = [];

	if (content && queryErrorChecker) {
		try {
			const message = validate_query(content) || "";
			const match = message.match(ERR_REGEX);

			if (match) {
				const lineNumber = Number.parseInt(match[1]);
				const column = Number.parseInt(match[2]);
				const reason = match[3].trim();

				markers.push({
					startLineNumber: lineNumber,
					startColumn: column,
					endLineNumber: lineNumber,
					endColumn: column,
					message: reason,
					severity: monaco.MarkerSeverity.Error,
				});
			}
		} catch(err) {
			console.error("Failed to validate query", err);
		}
	}

	monaco.editor.setModelMarkers(model, "owner", markers);

	return markers.length > 0;
}

/**
 * Set the theme of the editor
 *
 * @param scheme The color scheme
 */
export function setEditorTheme(scheme: ColorScheme) {
	editor.setTheme(scheme === "light" ? LIGHT_THEME : DARK_THEME);
}