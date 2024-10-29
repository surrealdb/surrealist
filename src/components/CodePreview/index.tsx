import classes from "./style.module.scss";

import { Compartment, EditorState, type Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { ActionIcon, Box, CopyButton, Paper, type PaperProps, Text } from "@mantine/core";
import { surrealql } from "@surrealdb/codemirror";
import clsx from "clsx";
import { type ReactNode, useEffect, useMemo, useRef } from "react";
import { editorTheme } from "~/editor";
import { useIsLight, useTheme } from "~/hooks/theme";
import { useConfigStore } from "~/stores/config";
import { dedent } from "~/util/dedent";
import { iconCheck, iconCopy } from "~/util/icons";
import { Icon } from "../Icon";

interface EditorRef {
	editor: EditorView;
	configComp: Compartment;
	themeComp: Compartment;
	wrapComp: Compartment;
}

export interface CodePreviewProps extends PaperProps {
	value: string;
	title?: string;
	withCopy?: boolean;
	withWrapping?: boolean;
	extensions?: Extension;
	rightSection?: ReactNode;
	withDedent?: boolean;
}

export function CodePreview({
	value,
	title,
	withCopy,
	withWrapping,
	extensions,
	rightSection,
	withDedent,
	className,
	...rest
}: CodePreviewProps) {
	const isLight = useIsLight();
	const editorRef = useRef<EditorRef>();
	const ref = useRef<HTMLDivElement | null>(null);

	const colorScheme = useTheme();
	const syntaxTheme = useConfigStore((s) => s.settings.appearance.syntaxTheme);

	const code = useMemo(() => {
		return withDedent ? dedent(value) : value;
	}, [value, withDedent]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: One-time initialization
	useEffect(() => {
		if (!ref.current) return;

		const configComp = new Compartment();
		const themeComp = new Compartment();
		const wrapComp = new Compartment();

		const initialState = EditorState.create({
			doc: code,
			extensions: [
				configComp.of(extensions || surrealql()),
				themeComp.of(editorTheme(colorScheme, syntaxTheme)),
				wrapComp.of(withWrapping ? EditorView.lineWrapping : []),
				EditorState.readOnly.of(true),
				EditorView.editable.of(false),
			],
		});

		const editor = new EditorView({
			state: initialState,
			parent: ref.current,
		});

		editorRef.current = {
			editor,
			configComp,
			themeComp,
			wrapComp,
		};

		return () => {
			editor.destroy();
		};
	}, []);

	useEffect(() => {
		if (!editorRef.current) return;

		const { editor } = editorRef.current;

		if (code === editor.state.doc.toString()) {
			return;
		}

		const transaction = editor.state.update({
			changes: {
				from: 0,
				to: editor.state.doc.length,
				insert: code,
			},
		});

		editor.dispatch(transaction);
	}, [code]);

	useEffect(() => {
		if (!editorRef.current) return;

		const { editor, configComp } = editorRef.current;

		editor.dispatch({
			effects: configComp.reconfigure(extensions || surrealql()),
		});
	}, [extensions]);

	useEffect(() => {
		if (!editorRef.current) return;

		const { editor, themeComp } = editorRef.current;

		editor.dispatch({
			effects: themeComp.reconfigure(editorTheme(colorScheme, syntaxTheme)),
		});
	}, [colorScheme, syntaxTheme]);

	useEffect(() => {
		if (!editorRef.current) return;

		const { editor, wrapComp } = editorRef.current;

		editor.dispatch({
			effects: wrapComp.reconfigure(withWrapping ? EditorView.lineWrapping : []),
		});
	}, [withWrapping]);

	const rightPadding = withCopy && !rightSection && !withWrapping;

	return (
		<>
			{title && (
				<Text
					ff="mono"
					tt="uppercase"
					fw={600}
					mb="sm"
					c="bright"
				>
					{title}
				</Text>
			)}
			<Paper
				p="xs"
				ref={ref}
				pos="relative"
				bg={isLight ? "slate.0" : "slate.9"}
				className={clsx(classes.root, className)}
				fz="lg"
				pr={rightPadding ? 40 : 0}
				{...rest}
			>
				{withCopy ? (
					<CopyButton value={value}>
						{({ copied, copy }) => (
							<ActionIcon
								variant={copied ? "gradient" : undefined}
								pos="absolute"
								top={6}
								right={6}
								onClick={copy}
								style={{ zIndex: 1 }}
								aria-label="Copy code to clipboard"
							>
								<Icon path={copied ? iconCheck : iconCopy} />
							</ActionIcon>
						)}
					</CopyButton>
				) : (
					rightSection && (
						<Box
							pos="absolute"
							top={6}
							right={6}
							style={{ zIndex: 1 }}
						>
							{rightSection}
						</Box>
					)
				)}
			</Paper>
		</>
	);
}
