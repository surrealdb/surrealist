import { history } from "@codemirror/commands";
import { forceLinting } from "@codemirror/lint";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import { EditorView, lineNumbers as renderLineNumbers, ViewUpdate } from "@codemirror/view";
import { Box, type BoxProps } from "@mantine/core";
import clsx from "clsx";
import { useEffect, useMemo, useRef } from "react";
import { editorBase, editorTheme } from "~/editor";
import { useSetting } from "~/hooks/config";
import { useTheme } from "~/hooks/theme";
import { useConfigStore } from "~/stores/config";
import classes from "./style.module.scss";
import { useStable } from "~/hooks/stable";
import equal from "fast-deep-equal";

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

	// biome-ignore lint/correctness/useExhaustiveDependencies: One-time initialization
	useEffect(() => {
		if (!elementRef.current) return;

		const editor = new EditorView({
			parent: elementRef.current,
			scrollTo: EditorView.scrollIntoView(0),
			state: EditorState.create(),
		});

		editorRef.current = editor;

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

	// biome-ignore lint/correctness/useExhaustiveDependencies: Ignore extensions
	useEffect(() => {
		if (!editorRef.current) return;

		const editor = editorRef.current;
		const current = editor.state.toJSON(serialize);

		if (equal(current, state) && initializedRef.current) {
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
		initializedRef.current = true;
	}, [state]);

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

	return (
		<Box
			ref={elementRef}
			className={clsx(classes.root, className)}
			fz={textSize}
			{...rest}
		/>
	);
}
