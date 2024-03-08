import classes from "./style.module.scss";
import * as monaco from 'monaco-editor';
import { ElementRef, useEffect, useRef } from "react";
import { BASE_EDITOR_CONFIG, wireHighlighting } from "~/util/editor";
import { Box, Paper } from "@mantine/core";
import { useSetting } from '~/hooks/config';
import { CodeEditorProps } from '../shared';

export function InternalMonacoEditor(props: CodeEditorProps) {
	const containerRef = useRef<ElementRef<"div">>(null);
	const elementRef = useRef<ElementRef<"div">>(null);
	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
	const [editorScale] = useSetting("appearance", "editorScale");

	const textSize = Math.floor(15 * (editorScale / 100));

	useEffect(() => {
		const editor = monaco.editor.create(elementRef.current!, {
			...BASE_EDITOR_CONFIG,
			...props.options,
			value: props.value || '',
			language: props.language || 'surrealql',
			fontSize: textSize
		});

		editorRef.current = editor;

		props.onMount?.(editor);

		if (props.language === "json") {
			editor.onDidChangeModelLanguageConfiguration(() => {
				wireHighlighting();
			});
		}

		editor.getModel()?.onDidChangeContent(() => {
			props.onChange?.(editor.getValue());
		});

		if (props.autoSize) {
			const updateHeight = () => {
				const contentHeight = Math.min(1000, editor.getContentHeight());
				const height = `${contentHeight}px`;

				elementRef.current!.style.height = height;

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

	useEffect(() => {
		editorRef.current?.updateOptions({
			fontSize: textSize
		});
	}, [textSize]);

	return (
		<Paper
			ref={containerRef}
			className={classes.root}
			style={{
				// position: props.autoSize ? 'relative' : undefined,
				fontFamily: "JetBrains Mono",
				...props.style,
			}}
		>
			<Box
				ref={elementRef}
				pos="absolute"
				left={18}
				right={18}
				top={0}
				bottom={0}
			/>
		</Paper>
	);
}
