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