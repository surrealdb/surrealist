import classes from "./style.module.scss";
import clsx from "clsx";
import dedent from "dedent";
import { surrealql } from "codemirror-surrealql";
import { Compartment, EditorState, Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { ActionIcon, Box, CopyButton, Paper, PaperProps, Text } from "@mantine/core";
import { ReactNode, useEffect, useMemo, useRef } from "react";
import { useIsLight } from "~/hooks/theme";
import { colorTheme } from "~/util/editor/extensions";
import { Icon } from "../Icon";
import { iconCheck, iconCopy } from "~/util/icons";

interface EditorRef {
	editor: EditorView;
	config: Compartment;
	theme: Compartment;
}

export interface CodePreviewProps extends PaperProps {
	value: string;
	title?: string;
	withCopy?: boolean;
	extensions?: Extension;
	rightSection?: ReactNode;
	withDedent?: boolean;
}

export function CodePreview({
	value,
	title,
	withCopy,
	extensions,
	rightSection,
	withDedent,
	className,
	...rest
}: CodePreviewProps) {
	const isLight = useIsLight();
	const editorRef = useRef<EditorRef>();
	const ref = useRef<HTMLDivElement | null>(null);

	const code = useMemo(() => {
		return withDedent ? dedent(value) : value;
	}, [value, withDedent]);

	useEffect(() => {
		const config = new Compartment();
		const theme = new Compartment();
		const configExt = config.of(extensions || surrealql());

		const initialState = EditorState.create({
			doc: code,
			extensions: [
				configExt,
				theme.of(colorTheme(isLight)),
				EditorState.readOnly.of(true),
				EditorView.lineWrapping,
				EditorView.editable.of(false),
			],

		});

		const editor = new EditorView({
			state: initialState,
			parent: ref.current!,
		});

		editorRef.current = {
			editor,
			config,
			theme,
		};

		return () => {
			editor.destroy();
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		const { editor } = editorRef.current!;

		if (code == editor.state.doc.toString()) {
			return;
		}

		const transaction = editor.state.update({
			changes: {
				from: 0,
				to: editor.state.doc.length,
				insert: code
			}
		});

		editor.dispatch(transaction);
	}, [code]);

	useEffect(() => {
		const { editor, config } = editorRef.current!;

		editor.dispatch({
			effects: config.reconfigure(extensions || surrealql())
		});
	}, [extensions]);

	useEffect(() => {
		const { editor, theme } = editorRef.current!;

		editor.dispatch({
			effects: theme.reconfigure(colorTheme(isLight))
		});
	}, [isLight]);

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
				bg={isLight ? 'slate.1' : 'slate.9'}
				className={clsx(classes.root, className)}
				fz="lg"
				{...rest}
			>
				{withCopy ? (
					<CopyButton value={value}>
						{({ copied, copy }) => (
							<ActionIcon
								variant={copied ? 'gradient' : undefined}
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
				) : rightSection && (
					<Box
						pos="absolute"
						top={6}
						right={6}
						style={{ zIndex: 1 }}
					>
						{rightSection}
					</Box>
				)}
			</Paper>
		</>
	);
}
