import * as monaco from 'monaco-editor';
import classes from './style.module.scss';
import { CSSProperties, ElementRef, HTMLAttributes, useEffect, useRef } from "react";
import { useIsLight } from "~/hooks/theme";
import { DARK_THEME, LIGHT_THEME, BASE_EDITOR_CONFIG, onEditorReady } from "~/util/editor";
import { Box, Paper, clsx } from "@mantine/core";

export interface SurrealistEditorProps extends Omit<HTMLAttributes<"div">, 'onChange'> {
	style?: CSSProperties;
	noExpand?: boolean;
	options?: monaco.editor.IStandaloneEditorConstructionOptions;
	value?: string;
	language?: string;
	height?: number;
	autoSize?: boolean;
	asInput?: boolean;
	onChange?: (value: string) => void;
	onMount?: (editor: monaco.editor.IStandaloneCodeEditor) => void;
}

export function SurrealistEditor(props: SurrealistEditorProps) {
	const isLight = useIsLight();
	const containerRef = useRef<ElementRef<"div">>(null);
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

		props.onMount?.(editor);
		
		editor.onDidChangeModelLanguageConfiguration(() => {
			onEditorReady(editor);
		});

		editor.getModel()?.onDidChangeContent(() => {
			props.onChange?.(editor.getValue());
		});

		if (props.autoSize) {
			const updateHeight = () => {
				const contentHeight = Math.min(1000, editor.getContentHeight());
				const height = `${contentHeight}px`;

				elementRef.current!.style.height = height;
				containerRef.current!.style.height = height;

				editor.layout({
					width: elementRef.current!.clientWidth,
					height: contentHeight
				});
			};
			
			editor.onDidContentSizeChange(updateHeight);
			updateHeight();
		}

		return () => {
			editor.dispose();
		};
	}, []);

	useEffect(() => {
		const editor = editorRef.current;

		if (props.value !== undefined && editor && editor.getValue() !== props.value) {
			editor.setValue(props.value);
		}
	}, [props.value]);

	return (
		<Paper
			ref={containerRef}
			withBorder={props.asInput}
			className={clsx(
				props.asInput && classes.inputEditor,
			)}
			style={{
				position: props.autoSize ? 'relative' : undefined,
				fontFamily: "JetBrains Mono",
				height: props.noExpand ? props.height : "100%",
				padding: props.asInput ? 8 : 0,
				...props.style,
			}}
		>
			<Box
				ref={elementRef}
				h="100%"
				pos={props.autoSize ? 'absolute' : undefined}
				inset={0}
			/>
		</Paper>
	);
}
