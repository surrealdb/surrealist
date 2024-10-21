import { history } from "@codemirror/commands";
import { forceLinting } from "@codemirror/lint";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import { EditorView, lineNumbers as renderLineNumbers } from "@codemirror/view";
import { Box, type BoxProps } from "@mantine/core";
import clsx from "clsx";
import { useEffect, useRef } from "react";
import { editorBase, editorTheme } from "~/editor";
import { useSetting } from "~/hooks/config";
import { useTheme } from "~/hooks/theme";
import { useConfigStore } from "~/stores/config";
import classes from "./style.module.scss";

interface EditorRef {
	editor: EditorView;
	readOnlyComp: Compartment;
	historyComp: Compartment;
	themeComp: Compartment;
	numbersComp: Compartment;
}

export interface CodeEditorProps extends BoxProps {
	value?: string;
	extensions?: Extension[];
	readOnly?: boolean;
	autoFocus?: boolean;
	historyKey?: string;
	lineNumbers?: boolean;
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
		lineNumbers,
		onMount,
		...rest
	} = props;

	const colorScheme = useTheme();
	const syntaxTheme = useConfigStore((s) => s.settings.appearance.syntaxTheme);
	const ref = useRef<HTMLDivElement | null>(null);
	const editorRef = useRef<EditorRef>();
	const [editorScale] = useSetting("appearance", "editorScale");

	const textSize = Math.floor(15 * (editorScale / 100));

	// biome-ignore lint/correctness/useExhaustiveDependencies: One-time initialization
	useEffect(() => {
		if (!ref.current) return;

		const readOnlyComp = new Compartment();
		const historyComp = new Compartment();
		const themeComp = new Compartment();
		const numbersComp = new Compartment();

		const changeHandler = EditorView.updateListener.of((update) => {
			if (update.docChanged) {
				onChange?.(update.state.doc.toString());
			}
		});

		const initialState = EditorState.create({
			doc: value,
			extensions: [
				editorBase(),
				readOnlyComp.of(EditorState.readOnly.of(!!readOnly)),
				historyComp.of(newHistory()),
				themeComp.of(editorTheme(colorScheme, syntaxTheme)),
				numbersComp.of(lineNumbers ? renderLineNumbers() : []),
				changeHandler,
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
			readOnlyComp,
			historyComp,
			themeComp,
			numbersComp,
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

		const { editor, readOnlyComp } = editorRef.current;

		editor.dispatch({
			effects: readOnlyComp.reconfigure(EditorState.readOnly.of(!!readOnly)),
		});
	}, [readOnly]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: History key used for reconfiguration
	useEffect(() => {
		if (!editorRef.current) return;

		const { editor, historyComp } = editorRef.current;

		editor.dispatch({
			effects: [historyComp.reconfigure([])],
		});

		editor.dispatch({
			effects: [historyComp.reconfigure([newHistory()])],
		});
	}, [historyKey]);

	useEffect(() => {
		if (!editorRef.current) return;

		const { editor, themeComp } = editorRef.current;

		editor.dispatch({
			effects: themeComp.reconfigure(editorTheme(colorScheme, syntaxTheme)),
		});
	}, [colorScheme, syntaxTheme]);

	useEffect(() => {
		if (!editorRef.current) return;

		const { editor, numbersComp } = editorRef.current;

		editor.dispatch({
			effects: numbersComp.reconfigure(lineNumbers ? renderLineNumbers() : []),
		});
	}, [lineNumbers]);

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
