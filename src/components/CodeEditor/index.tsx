import { history } from "@codemirror/commands";
import { forceLinting } from "@codemirror/lint";
import {
	Compartment,
	EditorSelection,
	EditorState,
	type Extension,
} from "@codemirror/state";
import {
	EditorView,
	ViewUpdate,
	lineNumbers as renderLineNumbers,
} from "@codemirror/view";
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
	onChange?: (
		value: string,
		snapshot: StateSnapshot,
		state: EditorState,
	) => void;
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
	const preventChangeNotificationsRef = useRef(true);
	const [editorScale] = useSetting("appearance", "editorScale");
	const textSize = Math.floor(15 * (editorScale / 100));

	// Persistent extension compartment
	const internalCompartment = useRef(new Compartment());
	const externalCompartment = useRef(new Compartment());
	const handleChange = useStable((update: ViewUpdate) => {
		// Only notify changes if initialization is complete AND we're not preventing notifications
		if (initializedRef.current && !preventChangeNotificationsRef.current) {
			onChange?.(
				update.state.doc.toString(),
				update.state.toJSON(serialize),
				update.state,
			);
		}
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

	// Create the editor
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

	// Update editor state when state prop changes. Do not recreate state when only
	// extensions change; those are handled by dedicated reconfigure effects.
	useEffect(() => {
		if (!editorRef.current) return;

		const editor = editorRef.current;
		const current = editor.state.toJSON(serialize);

		// Skip if state hasn't changed
		if (initializedRef.current && equal(current, state)) {
			return;
		}

		// Prevent change notifications while we're setting state
		preventChangeNotificationsRef.current = true;

		const combined = [
			internalCompartment.current.of(internalExtensions),
			externalCompartment.current.of(extensions ?? []),
		];

		// Preserve current doc and selection when recreating state without an
		// external snapshot to avoid cursor jumps.
		const newState = state
			? EditorState.fromJSON(state, { extensions: combined }, serialize)
			: EditorState.create({
					doc: editor.state.doc,
					selection: editor.state.selection ?? EditorSelection.cursor(0),
					extensions: combined,
				});

		editor.setState(newState);
		forceLinting(editor);

		// After state is set, allow change notifications to proceed
		requestAnimationFrame(() => {
			preventChangeNotificationsRef.current = false;
		});
	}, [state, serialize]);

	// Update textual editor contents
	useEffect(() => {
		if (!editorRef.current || value === undefined) return;

		const editor = editorRef.current;

		if (value === editor.state.doc.toString()) {
			return;
		}

		// Prevent change notifications while we're updating content
		preventChangeNotificationsRef.current = true;

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

		// After content is updated, allow change notifications to proceed
		requestAnimationFrame(() => {
			preventChangeNotificationsRef.current = false;
		});
	}, [value]);

	// Update internal extension state
	useEffect(() => {
		if (!editorRef.current) return;

		preventChangeNotificationsRef.current = true;

		editorRef.current.dispatch({
			effects: internalCompartment.current?.reconfigure(internalExtensions),
		});

		requestAnimationFrame(() => {
			preventChangeNotificationsRef.current = false;
		});
	}, [internalExtensions]);

	// Update external extension state
	useEffect(() => {
		if (!editorRef.current) return;

		preventChangeNotificationsRef.current = true;

		editorRef.current.dispatch({
			effects: externalCompartment.current?.reconfigure(extensions ?? []),
		});

		requestAnimationFrame(() => {
			preventChangeNotificationsRef.current = false;
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

		// Allow change notifications after initialization is complete
		requestAnimationFrame(() => {
			preventChangeNotificationsRef.current = false;
		});
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
