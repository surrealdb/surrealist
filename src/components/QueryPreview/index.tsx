import classes from "./style.module.scss";
import clsx from "clsx";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { Paper, PaperProps } from "@mantine/core";
import { useEffect, useRef } from "react";
import { useIsLight } from "~/hooks/theme";
import { colorTheme, surql } from "~/util/editor/extensions";

export interface QueryPreviewProps extends PaperProps {
	value: string;
}

export function QueryPreview({
	value,
	className,
	...rest
}: QueryPreviewProps) {
	const isLight = useIsLight();
	const ref = useRef<HTMLDivElement | null>(null);
	const editorRef = useRef<EditorView>();

	useEffect(() => {
		const initialState = EditorState.create({
			doc: value,
			extensions: [
				surql(),
				colorTheme(),
				EditorState.readOnly.of(true),
				EditorView.lineWrapping,
			]
		});

		const editor = new EditorView({
			state: initialState,
			parent: ref.current!
		});

		editorRef.current = editor;

		return () => {
			editor.destroy();
		};
	}, []);

	return (
		<Paper
			p="xs"
			ref={ref}
			bg={isLight ? 'slate.1' : 'slate.9'}
			className={clsx(classes.root, className)}
			fz="lg"
			{...rest}
		/>
	);
}