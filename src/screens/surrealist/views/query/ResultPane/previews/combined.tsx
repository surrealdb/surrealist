import { foldCode, unfoldCode } from "@codemirror/language";
import type { EditorView } from "@codemirror/view";
import { Box, Stack, Text } from "@mantine/core";
import { surrealql } from "@surrealdb/codemirror";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { CodeEditor } from "~/components/CodeEditor";
import { surqlRecordLinks } from "~/editor";
import { type Formatter, useResultFormatter } from "~/hooks/surrealql";
import { useInspector } from "~/providers/Inspector";
import classes from "../style.module.scss";
import { attemptFormat, type PreviewProps } from ".";

const COMBINED_QUERY_HEADER_REGEX = /-------- Query (\d+)(?:[^-]*)?--------/g;
const createCombinedQueryHeader = (index: number, execution_time?: string) =>
	`\n\n-------- Query ${index + 1}${execution_time ? ` (${execution_time})` : ""} --------\n\n`;

function processCombinedNoneResultHeaders(
	view: EditorView,
	responses: any[],
	action: (view: EditorView, lineNumber: number) => void,
) {
	const doc = view.state.doc;
	const text = doc.toString();

	COMBINED_QUERY_HEADER_REGEX.lastIndex = 0;
	let match: RegExpExecArray | null;

	match = COMBINED_QUERY_HEADER_REGEX.exec(text);
	while (match) {
		const queryNumber = parseInt(match[1], 10);
		const responseIndex = queryNumber - 1;

		const response = responses[responseIndex];
		if (response?.success && response.result === undefined) {
			const lineNumber = doc.lineAt(match.index).number;
			action(view, lineNumber);
		}
		match = COMBINED_QUERY_HEADER_REGEX.exec(text);
	}
}

export function buildCombinedResult(
	index: number,
	{ result, execution_time }: any,
	format: Formatter,
) {
	return createCombinedQueryHeader(index, execution_time) + attemptFormat(format, result);
}

export function CombinedPreview({ responses, query }: PreviewProps) {
	const [format] = useResultFormatter();
	const { inspect } = useInspector();
	const editorViewRef = useRef<EditorView | null>(null);
	const previousModeRef = useRef<string | null>(null);
	const noneResultMode = query.noneResultMode;

	const noneResultCount = useMemo(() => {
		return responses.filter((response) => response.success && response.result === undefined)
			.length;
	}, [responses]);

	const contents = useMemo(() => {
		return responses
			.reduce((acc, cur, i) => {
				if (noneResultMode === "hide") {
					if (cur.success && cur.result === undefined) {
						return acc;
					}
					return acc + buildCombinedResult(i, cur, format);
				}
				return acc + buildCombinedResult(i, cur, format);
			}, "")
			.trim();
	}, [responses, format, noneResultMode]);

	const extensions = useMemo(
		() => [surrealql("combined-results"), surqlRecordLinks(inspect)],
		[inspect],
	);

	const applyFolding = useCallback(
		(view: EditorView) => {
			const previousMode = previousModeRef.current;
			const modeChanged = previousMode !== noneResultMode;

			previousModeRef.current = noneResultMode;

			if (noneResultMode === "collapse") {
				processCombinedNoneResultHeaders(view, responses, (view, lineNumber) => {
					view.dispatch({
						selection: { anchor: view.state.doc.line(lineNumber).from },
					});
					foldCode(view);
				});
			} else if (modeChanged && previousMode === "collapse") {
				processCombinedNoneResultHeaders(view, responses, (view, lineNumber) => {
					view.dispatch({
						selection: { anchor: view.state.doc.line(lineNumber).from },
					});
					unfoldCode(view);
				});
			}
		},
		[responses, noneResultMode],
	);

	useEffect(() => {
		const view = editorViewRef.current;
		if (!view) {
			return;
		}

		applyFolding(view);
	}, [applyFolding]);

	return (
		<Stack
			gap="sm"
			className={classes.combinedStack}
		>
			{noneResultMode === "hide" && noneResultCount > 0 && (
				<Box px="sm">
					<Text
						size="sm"
						c="dimmed"
					>
						{noneResultCount} NONE {noneResultCount === 1 ? "result" : "results"} hidden
						(Change in preferences to show)
					</Text>
				</Box>
			)}

			<CodeEditor
				value={contents}
				readOnly
				extensions={extensions}
				className={classes.combinedEditor}
				onMount={(view) => {
					editorViewRef.current = view;
					applyFolding(view);
				}}
			/>
		</Stack>
	);
}
