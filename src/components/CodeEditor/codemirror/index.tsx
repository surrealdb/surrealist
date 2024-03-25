import classes from "./style.module.scss";
import clsx from "clsx";
import { Box } from "@mantine/core";
import { useEffect, useRef } from "react";
import { CodeEditorProps } from "../shared";
import { useSetting } from "~/hooks/config";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { surrealist } from "~/util/editor/extensions";
import { forceLinting } from "@codemirror/lint";

interface EditorRef {
	editor: EditorView;
	editable: Compartment;
}

export function InternalCodeMirrorEditor(props: CodeEditorProps) {
	const {
		value,
		onChange,
		extensions,
		className,
		readOnly,
		language: _1,
		onMount: _3,
		options: _4,
		height: _5,
		autoSize: _6,
		...rest
	} = props;

	const ref = useRef<HTMLDivElement | null>(null);
	const editorRef = useRef<EditorRef>();
	const [editorScale] = useSetting("appearance", "editorScale");

	const textSize = Math.floor(15 * (editorScale / 100));

	useEffect(() => {
		const editable = new Compartment();
		const editableExt = editable.of(EditorView.editable.of(!readOnly));

		const changeHandler = EditorView.updateListener.of((update) => {
			if (update.docChanged) {
				onChange?.(update.state.doc.toString());
			}
		});

		const initialState = EditorState.create({
			doc: value,
			extensions: [
				surrealist(),
				changeHandler,
				editableExt,
				extensions || [],
			]
		});

		const editor = new EditorView({
			state: initialState,
			parent: ref.current!,
			scrollTo: EditorView.scrollIntoView(0),
		});

		editorRef.current = {
			editor,
			editable
		};

		return () => {
			editor.destroy();
		};
	}, []);

	useEffect(() => {
		const { editor } = editorRef.current!;

		if (value == editor.state.doc.toString()) {
			return;
		}

		const transaction = editor.state.update({
			changes: {
				from: 0,
				to: editor.state.doc.length,
				insert: value
			},
			effects: [
				EditorView.scrollIntoView(0)
			]
		});

		editor.dispatch(transaction);
		forceLinting(editor);
	}, [value]);

	useEffect(() => {
		const { editor, editable } = editorRef.current!;
		const editableExt = EditorView.editable.of(!readOnly);

		editor.dispatch({
			effects: editable.reconfigure(editableExt)
		});
	}, [readOnly]);

	return (
		<Box
			ref={ref}
			className={clsx(classes.root, className)}
			fz={textSize}
			{...rest}
		/>
	);
}
