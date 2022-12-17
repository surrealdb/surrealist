import { Modal } from "@mantine/core";
import { Monaco } from "@monaco-editor/react";
import { editor, languages } from "monaco-editor";
import { store } from "~/store";
import { getSurreal } from "~/surreal";

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

	monaco.editor.defineTheme('surrealist', {
		base: 'vs',
		inherit: true,
		rules: [
			{ token: 'keyword', foreground: '#e600a4' },
			{ token: 'param', foreground: '#e67a15' },
			{ token: 'comment', foreground: '#606475' },
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
			'USE', 'LET', 'BEGIN', 'CANCEL', 'COMMIT', 'IF', 'ELSE', 'SELECT', 'INSERT', 'CREATE',
			'UPDATE', 'RELATE', 'DELETE', 'DEFINE', 'REMOVE', 'INFO', 'FROM', 'SET', 'FOR', 'NS', 'DB',
			'TRANSACTION', 'THEN', 'END', 'WHERE', 'SPLIT', 'AT', 'GROUP', 'BY', 'ORDER', 'ASC', 'DESC',
			'COLLATE', 'NUMERIC', 'LIMIT', 'START', 'FETCH', 'TIMEOUT', 'PARALLEL', 'CONTENT', 'RETURN',
			'NONE', 'BEFORE', 'AFTER', 'DIFF', 'MERGE', 'PATCH', 'SCOPE', 'TABLE', 'AS', 'AND', 'OR',
			'CONTAINS', 'CONTAINSNOT', 'CONTAINSALL', 'CONTAINSANY', 'CONTAINSNONE', 'INSIDE', 'NOTINSIDE',
			'ALLINSIDE', 'ANYINSIDE', 'NONEINSIDE', 'OUTSIDE', 'INTERSECTS', 'KV'
		],
		tokenizer: {
			root: [
				[/\b\w+\b/, {
					cases: {
						'@keywords': 'keyword',
						'@default': 'variable'
					}
				}],
				[/".*?"/, 'string'],
				[/(\/\/|#|--).+/, 'comment'],
				[/\$\w+/, 'param']
			]
		}
	});

	// table intellisense
	monaco.languages.registerCompletionItemProvider('surrealql', {
		triggerCharacters: [' '],
		provideCompletionItems: async (model, position, context) => {
			const { tableSuggest } = store.getState();
			const surreal = getSurreal();

			if (!tableSuggest || !surreal) {
				return undefined;
			}

			const linePrefix = model.getLineContent(position.lineNumber).substring(0, position.column);
			const isAuto = context.triggerKind === languages.CompletionTriggerKind.TriggerCharacter;

			if (isAuto && !linePrefix.toUpperCase().endsWith('FROM ')) {
				return undefined;
			}

			const response = await surreal.query('INFO FOR DB');
			const result = response[0].result;
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
		}
	});

	// variable intellisense
	monaco.languages.registerCompletionItemProvider('surrealql', {
		triggerCharacters: ['$'],
		provideCompletionItems(_, position, context) {
			const { activeTab, knownTabs } = store.getState();
			const tab = knownTabs.find(tab => tab.id == activeTab);

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