import { Monaco } from "@monaco-editor/react";
import { editor, KeyCode, KeyMod, languages } from "monaco-editor";
import { store } from "~/store";
import { getSurreal } from "~/surreal";

const tablePrefixes = [
	'FROM ',
	'UPDATE ',
	'CREATE ',
	'DELETE ',
	'INTO '
]

export const baseEditorConfig: editor.IStandaloneEditorConstructionOptions = {
	scrollBeyondLastLine: false,
	overviewRulerLanes: 0,
	fontFamily: 'JetBrains Mono',
	renderLineHighlight: 'none',
	lineDecorationsWidth: 12,
	lineNumbersMinChars: 1,
	glyphMargin: false,
	theme: 'surrealist',
	automaticLayout: true,
	minimap: {
		enabled: false
	}
}

export function initializeEditor(monaco: Monaco) {

	// monaco is truly inept at handling font loading hence
	// this monstrous hack to force it to remeasure fonts
	document.fonts.ready.then(() => {
		let task = setInterval(() => {
			monaco.editor.remeasureFonts();
		}, 1000);

		setTimeout(() => {
			clearInterval(task);
		}, 1000 * 15);
	});

	monaco.editor.defineTheme('surrealist', {
		base: 'vs',
		inherit: true,
		rules: [
			{ token: 'keyword', foreground: '#e600a4' },
			{ token: 'param', foreground: '#e67a15' },
			{ token: 'comment', foreground: '#606475' },
			{ token: 'fancy', foreground: '#09b8ac' },
			{ token: 'function', foreground: '#9565cf' },
		],
		colors: {
			'editorLineNumber.foreground': '#9BA9C6',
			'editorLineNumber.activeForeground': '#465671'
		}
	});

	monaco.editor.defineTheme('surrealist-dark', {
		base: 'vs-dark',
		inherit: true,
		rules: [
			{ token: 'keyword', foreground: '#e600a4' },
			{ token: 'param', foreground: '#e67a15' },
			{ token: 'comment', foreground: '#606475' },
			{ token: 'fancy', foreground: '#09b8ac' },
			{ token: 'function', foreground: '#cb96ff' },
		],
		colors: {
			'editor.background': '#1a1b1e',
			'editorLineNumber.foreground': '#465671',
			'editorLineNumber.activeForeground': '#9BA9C6'
		}
	});

	monaco.languages.register({ id: 'surrealql' });

	monaco.languages.setMonarchTokensProvider('surrealql', {
		ignoreCase: true,
		keywords: [
			'USE', 'LET', 'BEGIN', 'CANCEL', 'COMMIT', 'IF', 'ELSE', 'SELECT', 'INSERT', 'INTO', 'CREATE',
			'UPDATE', 'RELATE', 'DELETE', 'DEFINE', 'REMOVE', 'INFO', 'FROM', 'SET', 'FOR', 'NS', 'DB',
			'TRANSACTION', 'THEN', 'END', 'WHERE', 'SPLIT', 'AT', 'GROUP', 'BY', 'ORDER', 'ASC', 'DESC',
			'COLLATE', 'NUMERIC', 'LIMIT', 'START', 'FETCH', 'TIMEOUT', 'PARALLEL', 'CONTENT', 'RETURN',
			'NONE', 'BEFORE', 'AFTER', 'DIFF', 'MERGE', 'PATCH', 'SCOPE', 'TABLE', 'AS', 'AND', 'OR',
			'CONTAINS', 'CONTAINSNOT', 'CONTAINSALL', 'CONTAINSANY', 'CONTAINSNONE', 'INSIDE', 'NOTINSIDE',
			'ALLINSIDE', 'ANYINSIDE', 'NONEINSIDE', 'OUTSIDE', 'INTERSECTS', 'KV', 'SCHEMALESS', 'SCHEMAFULL',
			'PERMISSIONS', 'FULL', 'NAMESPACE', 'DATABASE', 'LOGIN', 'ON', 'PASSWORD', 'PASSHASH', 'TYPE', 'VALUE',
			'TOKEN', 'DROP', 'EVENT', 'FIELD', 'ON', 'WHEN', 'ASSERT', 'INDEX', 'FIELDS', 'COLUMNS', 'UNIQUE',
			'FUNCTION', 'LIVE', 'KILL', 'FULLTEXT', 'SESSION', 'SIGNUP', 'SIGNIN'
		],
		tokenizer: {
			root: [
				[/(count|(\w+::)+\w+)(?=\()/, 'function'],
				[/["'].*?["']/, 'string'],
				[/\/.*?[^\\]\/|<future>/, 'fancy'],
				[/(\/\/|#|--).+/, 'comment'],
				[/\$\w+/, 'param'],
				[/\b\w+\b/, {
					cases: {
						'@keywords': 'keyword',
						'@default': 'variable'
					}
				}]
			]
		}
	});

	// table intellisense
	monaco.languages.registerCompletionItemProvider('surrealql', {
		triggerCharacters: [' '],
		provideCompletionItems: async (model, position, context) => {
			const { tableSuggest } = store.getState().config;
			const surreal = getSurreal();

			if (!tableSuggest || !surreal) {
				return undefined;
			}

			const linePrefix = model.getLineContent(position.lineNumber).substring(0, position.column);
			const isAuto = context.triggerKind === languages.CompletionTriggerKind.TriggerCharacter;

			if (isAuto && !tablePrefixes.some(pre => linePrefix.toUpperCase().endsWith(pre))) {
				return undefined;
			}

			try {
				const response = await surreal.query('INFO FOR DB');
				const result = response[0].result;
				
				if (!result) {
					return {
						suggestions: []
					}
				}

				const tables = Object.keys(result.tb);
				const suggestions = tables.map(table => ({
					label: table,
					insertText: table,
					kind: languages.CompletionItemKind.Class,
					range: monaco.Range.fromPositions(position, position)
				}));

				return {
					suggestions
				}
			} catch (e) {
				return {
					suggestions: []
				}
			}
		}
	});

	// variable intellisense
	monaco.languages.registerCompletionItemProvider('surrealql', {
		triggerCharacters: ['$'],
		provideCompletionItems(_, position, context) {
			const { config } = store.getState();
			const tab = config.tabs.find(tab => tab.id == config.activeTab);

			if(!tab) {
				return undefined;
			}

			const variables = JSON.parse(tab.variables);
			const variableNames = Object.keys(variables);
			
			if(!variableNames.length) {
				return undefined;
			}

			const isAuto = context.triggerKind === languages.CompletionTriggerKind.TriggerCharacter;
			const suggestions: languages.CompletionItem[] = variableNames.map(variableName => ({
				label: `$${variableName}`,
				insertText: (isAuto ? '' : '$') + variableName,
				detail: `${variables[variableName]}`,
				kind: languages.CompletionItemKind.Variable,
				range: monaco.Range.fromPositions(position, position)
			}));

			return {
				suggestions
			}
		}
	});
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
		id: 'run-query',
		label: 'Run Query',
		keybindings: [
			KeyMod.CtrlCmd | KeyCode.Enter,
			KeyCode.F9
		],
		run: () => onExecute()
	});

	editor.addAction({
		id: 'comment-query',
		label: 'Comment Query',
		keybindings: [
			KeyMod.CtrlCmd | KeyCode.Slash
		],
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
			}
						   
			const text = model.getValueInRange(range);
			const lines = text.split('\n');

			if(!lines) {
				return;
			}

			const hasComment = lines.some(line => line.trim().startsWith('#'));

			const comment = lines.map(line => {
				return hasComment ? line.replace(/^# /, '') : `# ${line}`;
			}).join('\n');

			editor.executeEdits('comment-query', [{
				range,
				text: comment
			}]);
		}
	});
}