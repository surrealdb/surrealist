import { surrealql } from "@surrealdb/codemirror";
import { useMemo } from "react";
import { CodeEditor } from "~/components/CodeEditor";
import { surqlRecordLinks } from "~/editor";
import { type Formatter, useResultFormatter } from "~/hooks/surrealql";
import { useInspector } from "~/providers/Inspector";
import { type PreviewProps, attemptFormat } from ".";

export function buildCombinedResult(
	index: number,
	{ result, execution_time }: any,
	format: Formatter,
) {
	const header = `\n\n-------- Query ${index + 1 + (execution_time ? ` (${execution_time})` : "")} --------\n\n`;

	return header + attemptFormat(format, result);
}

export function CombinedPreview({ responses }: PreviewProps) {
	const [format] = useResultFormatter();
	const { inspect } = useInspector();

	const contents = useMemo(() => {
		return responses
			.reduce((acc, cur, i) => acc + buildCombinedResult(i, cur, format), "")
			.trim();
	}, [responses, format]);

	return (
		<CodeEditor
			value={contents}
			readOnly
			extensions={[surrealql("combined-results"), surqlRecordLinks(inspect)]}
		/>
	);
}
