import { history } from "@codemirror/commands";
import { forceLinting } from "@codemirror/lint";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import { EditorView, ViewUpdate, lineNumbers as renderLineNumbers } from "@codemirror/view";
import { Box, type BoxProps } from "@mantine/core";
import clsx from "clsx";
import equal from "fast-deep-equal";
import { useEffect, useMemo, useRef } from "react";
import { editorBase, editorTheme } from "~/editor";
import { useSetting } from "~/hooks/config";
import { useStable } from "~/hooks/stable";
import { useTheme } from "~/hooks/theme";
import { useConfigStore } from "~/stores/config";
import classes from "./style.module.scss";

export type StateSnapshot = {
	doc: string;
	[key: string]: any;
};

export interface CodeEditorProps extends BoxProps {
	value?: string;
	state?: StateSnapshot;
	extensions?: Extension[];
	readOnly?: boolean;
	autoFocus?: boolean;
	lineNumbers?: boolean;
	serialize?: Record<string, any>;
	onMount?: (editor: EditorView) => void;
	onChange?: (value: string, state: StateSnapshot) => void;
}

export function CodeEditor(props: CodeEditorProps) {
	const {
		value,
		state,
		onChange,
		extensions,
		className,
		readOnly,
		autoFocus,
		lineNumbers,
		serialize,
		onMount,
		...rest
	} = props;

	const colorScheme = useTheme();
	const syntaxTheme = useConfigStore((s) => s.settings.appearance.syntaxTheme);
	const elementRef = useRef<HTMLDivElement | null>(null);
	const editorRef = useRef<EditorView>();
	const initializedRef = useRef(false);
	const [editorScale] = useSetting("appearance", "editorScale");
	const textSize = Math.floor(15 * (editorScale / 100));

	// Persistent extension compartment
	const internalCompartment = useRef(new Compartment());
	const externalCompartment = useRef(new Compartment());
	const handleChange = useStable((update: ViewUpdate) => {
		onChange?.(update.state.doc.toString(), update.state.toJSON(serialize));
	});

	// The internally controlled extensions
	const internalExtensions = useMemo(
		() => [
			editorBase(),
			history({ newGroupDelay: 250 }),
			EditorState.readOnly.of(!!readOnly),
			editorTheme(colorScheme, syntaxTheme),
			lineNumbers ? renderLineNumbers() : [],
			EditorView.updateListener.of((update) => {
				if (update.docChanged || update.selectionSet) {
					handleChange(update);
				}
			}),
		],
		[readOnly, colorScheme, syntaxTheme, lineNumbers],
	);

	// Mount the editor
	useEffect(() => {
		if (!elementRef.current) return;

		const editor = new EditorView({
			parent: elementRef.current,
			scrollTo: EditorView.scrollIntoView(0),
			state: EditorState.create(),
		});

		editorRef.current = editor;

		return () => {
			editor.destroy();
		};
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Update only state
	useEffect(() => {
		if (!editorRef.current) return;

		const editor = editorRef.current;
		const current = editor.state.toJSON(serialize);

		// Always update state on initialization
		if (initializedRef.current && equal(current, state)) {
			return;
		}

		const combined = [
			internalCompartment.current.of(internalExtensions),
			externalCompartment.current.of(extensions ?? []),
		];

		const newState = state
			? EditorState.fromJSON(state, { extensions: combined }, serialize)
			: EditorState.create({ extensions: combined });

		editor.setState(newState);
		forceLinting(editor);
	}, [state]);

	// Update textual editor contents
	useEffect(() => {
		if (!editorRef.current) return;

		const editor = editorRef.current;

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

	// Update internal extension state
	useEffect(() => {
		editorRef.current?.dispatch({
			effects: internalCompartment.current?.reconfigure(internalExtensions),
		});
	}, [internalExtensions]);

	// Update external extension state
	useEffect(() => {
		editorRef.current?.dispatch({
			effects: externalCompartment.current?.reconfigure(extensions ?? []),
		});
	}, [extensions]);

	// Automatically focus the editor
	useEffect(() => {
		if (!editorRef.current) return;

		const editor = editorRef.current;

		if (autoFocus) {
			const timer = setInterval(() => {
				editor.focus();
				if (editor.hasFocus) clearInterval(timer);
			}, 50);
		}
	}, [autoFocus]);

	// Complete one-time initialization
	useEffect(() => {
		if (!editorRef.current || initializedRef.current) return;

		const editor = editorRef.current;

		onMount?.(editor);
		initializedRef.current = true;
	}, [onMount]);

	return (
		<Box
			ref={elementRef}
			className={clsx(classes.root, className)}
			fz={textSize}
			{...rest}
		/>
	);
}
