import { foldCode, unfoldCode } from "@codemirror/language";
import type { EditorView } from "@codemirror/view";
import { Box, Stack, Text } from "@mantine/core";
import { surrealql } from "@surrealdb/codemirror";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { CodeEditor } from "~/components/CodeEditor";
import { surqlRecordLinks } from "~/editor";
import { type Formatter, useResultFormatter } from "~/hooks/surrealql";
import { useInspector } from "~/providers/Inspector";
import { QueryResponse } from "~/types";
import classes from "../style.module.scss";
import { attemptFormat, type PreviewProps } from ".";

const COMBINED_QUERY_HEADER_REGEX = /-------- Query (\d+)(?:[^-]*)?--------/g;
const createCombinedQueryHeader = (index: number, execution_time?: string): string =>
	`\n\n-------- Query ${index + 1}${execution_time ? ` (${execution_time})` : ""} --------\n\n`;

// Cached regex matches to avoid repeated execution
const regexMatchCache = new Map<string, RegExpMatchArray[]>();
function getRegexMatches(text: string): RegExpMatchArray[] {
	if (regexMatchCache.has(text)) {
		return regexMatchCache.get(text) || [];
	}

	const matches: RegExpMatchArray[] = [];
	COMBINED_QUERY_HEADER_REGEX.lastIndex = 0;
	let match: RegExpExecArray | null;

	// biome-ignore lint/suspicious/noAssignInExpressions: Standard pattern for regex iteration
	while ((match = COMBINED_QUERY_HEADER_REGEX.exec(text)) !== null) {
		matches.push(match);
	}

	regexMatchCache.set(text, matches);
	return matches;
}

function processCombinedNoneResultHeaders(
	view: EditorView,
	responses: QueryResponse[],
	action: (view: EditorView, lineNumber: number) => void,
) {
	const doc = view.state.doc;
	const text = doc.toString();
	const matches = getRegexMatches(text);

	// Batch DOM operations for better performance
	const linesToProcess: number[] = [];

	for (const match of matches) {
		const queryNumber = parseInt(match[1], 10);
		const responseIndex = queryNumber - 1;
		const response = responses[responseIndex];

		if (response?.success && response.result === undefined && match.index !== undefined) {
			const lineNumber = doc.lineAt(match.index).number;
			linesToProcess.push(lineNumber);
		}
	}

	// Execute all actions in a single batch
	for (const lineNumber of linesToProcess) {
		action(view, lineNumber);
	}
}

export function buildCombinedResult(
	index: number,
	{ result, execution_time }: any,
	format: Formatter,
): string {
	const header = createCombinedQueryHeader(index, execution_time);
	const formattedContent = attemptFormat(format, result);
	return header + formattedContent;
}

const combinedPreview = memo(function CombinedPreview({ responses, query }: PreviewProps) {
	const [format] = useResultFormatter();
	const { inspect } = useInspector();
	const editorViewRef = useRef<EditorView | null>(null);
	const previousModeRef = useRef<string | null>(null);
	const noneResultMode = query.noneResultMode;

	const noneResultCount = useMemo(() => {
		let count = 0;
		for (const response of responses) {
			if (response.success && response.result === undefined) {
				count++;
			}
		}
		return count;
	}, [responses]);

	const contents = useMemo(() => {
		const parts: string[] = [];

		for (let i = 0; i < responses.length; i++) {
			const response = responses[i];

			// Skip hidden none results
			if (noneResultMode === "hide" && response.success && response.result === undefined) {
				continue;
			}

			parts.push(buildCombinedResult(i, response, format));
		}

		return parts.join("").trim();
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
				const foldAction = (view: EditorView, lineNumber: number) => {
					view.dispatch({
						selection: { anchor: view.state.doc.line(lineNumber).from },
					});
					foldCode(view);
				};
				processCombinedNoneResultHeaders(view, responses, foldAction);
			} else if (modeChanged && previousMode === "collapse") {
				const unfoldAction = (view: EditorView, lineNumber: number) => {
					view.dispatch({
						selection: { anchor: view.state.doc.line(lineNumber).from },
					});
					unfoldCode(view);
				};
				processCombinedNoneResultHeaders(view, responses, unfoldAction);
			}
		},
		[responses, noneResultMode],
	);

	useEffect(() => {
		const view = editorViewRef.current;
		if (!view) return;

		applyFolding(view);
	}, [applyFolding]);

	// Memoize the hidden message to prevent recreating text
	const hiddenMessage = useMemo(() => {
		if (noneResultMode !== "hide" || noneResultCount === 0) return null;

		const resultText = noneResultCount === 1 ? "result" : "results";
		return `${noneResultCount} NONE ${resultText} hidden (Change in preferences to show)`;
	}, [noneResultMode, noneResultCount]);

	// Memoized mount handler
	const handleMount = useCallback(
		(view: EditorView) => {
			editorViewRef.current = view;
			applyFolding(view);
		},
		[applyFolding],
	);

	return (
		<Stack
			gap="sm"
			className={classes.combinedStack}
		>
			{hiddenMessage && (
				<Box px="sm">
					<Text
						size="sm"
						c="dimmed"
					>
						{hiddenMessage}
					</Text>
				</Box>
			)}

			<CodeEditor
				value={contents}
				readOnly
				extensions={extensions}
				className={classes.combinedEditor}
				onMount={handleMount}
			/>
		</Stack>
	);
});

export const CombinedPreview = combinedPreview;
