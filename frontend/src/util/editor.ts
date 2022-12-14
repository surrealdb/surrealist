import { Monaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";

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
			'ALLINSIDE', 'ANYINSIDE', 'NONEINSIDE', 'OUTSIDE', 'INTERSECTS'
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
				[/(\/\/|#|--)/, 'comment'],
				[/\$\w+/, 'param']
			]
		}
	});
}