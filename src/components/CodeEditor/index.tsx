import { history } from "@codemirror/commands";
import { forceLinting } from "@codemirror/lint";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { Box, type BoxProps } from "@mantine/core";
import clsx from "clsx";
import { useEffect, useRef } from "react";
import { colorTheme, editorBase } from "~/editor";
import { useSetting } from "~/hooks/config";
import { useIsLight } from "~/hooks/theme";
import classes from "./style.module.scss";

interface EditorRef {
	editor: EditorView;
	editable: Compartment;
	history: Compartment;
	theme: Compartment;
}

export interface CodeEditorProps extends BoxProps {
	value?: string;
	extensions?: Extension[];
	readOnly?: boolean;
	autoFocus?: boolean;
	historyKey?: string;
	onMount?: (editor: EditorView) => void;
	onChange?: (value: string) => void;
}

export function CodeEditor(props: CodeEditorProps) {
	const {
		value,
		onChange,
		extensions,
		className,
		readOnly,
		autoFocus,
		historyKey,
		onMount,
		...rest
	} = props;

	const isLight = useIsLight();
	const ref = useRef<HTMLDivElement | null>(null);
	const editorRef = useRef<EditorRef>();
	const [editorScale] = useSetting("appearance", "editorScale");

	const textSize = Math.floor(15 * (editorScale / 100));

	// biome-ignore lint/correctness/useExhaustiveDependencies: One-time initialization
	useEffect(() => {
		if (!ref.current) return;

		const editable = new Compartment();
		const history = new Compartment();
		const theme = new Compartment();
		const editableExt = editable.of(EditorState.readOnly.of(!!readOnly));
		const historyExt = history.of(newHistory());

		const changeHandler = EditorView.updateListener.of((update) => {
			if (update.docChanged) {
				onChange?.(update.state.doc.toString());
			}
		});

		const initialState = EditorState.create({
			doc: value,
			extensions: [
				editorBase(),
				theme.of(colorTheme(isLight)),
				historyExt,
				changeHandler,
				editableExt,
				extensions || [],
			],
		});

		const editor = new EditorView({
			state: initialState,
			parent: ref.current,
			scrollTo: EditorView.scrollIntoView(0),
		});

		editorRef.current = {
			editor,
			editable,
			history,
			theme,
		};

		if (autoFocus) {
			const timer = setInterval(() => {
				editor.focus();
				if (editor.hasFocus) clearInterval(timer);
			}, 50);
		}

		onMount?.(editor);

		return () => {
			editor.destroy();
		};
	}, []);

	useEffect(() => {
		if (!editorRef.current) return;

		const { editor } = editorRef.current;

		if (value === editor.state.doc.toString()) {
			return;
		}

		const transaction = editor.state.update({
			changes: {
				from: 0,
				to: editor.state.doc.length,
				insert: value,
			},
			effects: [EditorView.scrollIntoView(0)],
		});

		editor.dispatch(transaction);
		forceLinting(editor);
	}, [value]);

	useEffect(() => {
		if (!editorRef.current) return;

		const { editor, editable } = editorRef.current;
		const editableExt = EditorState.readOnly.of(!!readOnly);

		editor.dispatch({
			effects: editable.reconfigure(editableExt),
		});
	}, [readOnly]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: History key used for reconfiguration
	useEffect(() => {
		if (!editorRef.current) return;

		const { editor, history } = editorRef.current;

		editor.dispatch({
			effects: [history.reconfigure([])],
		});

		editor.dispatch({
			effects: [history.reconfigure([newHistory()])],
		});
	}, [historyKey]);

	useEffect(() => {
		if (!editorRef.current) return;

		const { editor, theme } = editorRef.current;

		editor.dispatch({
			effects: theme.reconfigure(colorTheme(isLight)),
		});
	}, [isLight]);

	return (
		<Box
			ref={ref}
			className={clsx(classes.root, className)}
			fz={textSize}
			{...rest}
		/>
	);
}

const newHistory = () => history({ newGroupDelay: 250 });
