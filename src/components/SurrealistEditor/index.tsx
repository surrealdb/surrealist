import * as monaco from 'monaco-editor';
import { CSSProperties, ElementRef, HTMLAttributes, useEffect, useRef } from "react";
import { useIsLight } from "~/hooks/theme";
import { DARK_THEME, LIGHT_THEME, BASE_EDITOR_CONFIG, getGrammar } from "~/util/editor";
import { Registry } from "monaco-textmate";
import { wireTmGrammars } from "monaco-editor-textmate";
import { Box } from "@mantine/core";

export interface SurrealistEditorProps extends Omit<HTMLAttributes<"div">, 'onChange'> {
	style?: CSSProperties;
	noExpand?: boolean;
	options?: monaco.editor.IStandaloneEditorConstructionOptions;
	value?: string;
	language?: string;
	height?: number;
	onChange?: (value: string) => void;
	onMount?: (editor: monaco.editor.IStandaloneCodeEditor) => void;
}

export function SurrealistEditor(props: SurrealistEditorProps) {
	const isLight = useIsLight();
	const elementRef = useRef<ElementRef<"div">>(null);
	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();

	useEffect(() => {
		const editor = monaco.editor.create(elementRef.current!, {
			...BASE_EDITOR_CONFIG,
			...props.options,
			value: props.value || '',
			theme: isLight ? LIGHT_THEME : DARK_THEME,
			language: props.language || 'surrealql'
		});

		editorRef.current = editor;

		document.fonts.ready.then(() => {
			monaco.editor.remeasureFonts();
		});

		props.onMount?.(editor);

		editor.getModel()?.onDidChangeContent(() => {
			props.onChange?.(editor.getValue());
		});

		const registry = new Registry({
			getGrammarDefinition: async (scopeName) => {
				return getGrammar(scopeName);
			}
		});

		const grammars = new Map();

		grammars.set('surrealql', 'source.surql');
		grammars.set('javascript', 'source.js');

		wireTmGrammars(monaco, registry, grammars);

		return () => {
			editor.dispose();
		};
	}, []);

	useEffect(() => {
		const editor = editorRef.current;

		if (props.value && editor && editor.getValue() !== props.value) {
			editor.setValue(props.value);
		}
	}, [props.value]);

	return (
		<div
			style={{
				...props.style,
				fontFamily: "JetBrains Mono",
				height: props.noExpand ? props.height : "100%",
			}}
		>
			<Box ref={elementRef} h="100%" />
		</div>
	);
}
