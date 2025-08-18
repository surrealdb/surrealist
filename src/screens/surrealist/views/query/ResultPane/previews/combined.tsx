import { Box, Stack, Text } from "@mantine/core";
import { surrealql } from "@surrealdb/codemirror";
import { useMemo } from "react";
import { CodeEditor } from "~/components/CodeEditor";
import { surqlRecordLinks } from "~/editor";
import { type Formatter, useResultFormatter } from "~/hooks/surrealql";
import { useInspector } from "~/providers/Inspector";
import classes from "../style.module.scss";
import { attemptFormat, type PreviewProps } from ".";

export function buildCombinedResult(
	index: number,
	{ result, execution_time }: any,
	format: Formatter,
) {
	const header = `\n\n-------- Query ${index + 1 + (execution_time ? ` (${execution_time})` : "")} --------\n\n`;

	return header + attemptFormat(format, result);
}

export function CombinedPreview({ responses, query }: PreviewProps) {
	const [format] = useResultFormatter();
	const { inspect } = useInspector();

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
			/>
		</Stack>
	);
}
