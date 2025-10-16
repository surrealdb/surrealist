import { Text } from "@mantine/core";
import { surrealql } from "@surrealdb/codemirror";
import { useMemo } from "react";
import { CodeEditor } from "~/components/CodeEditor";
import { surqlRecordLinks } from "~/editor";
import { useSetting } from "~/hooks/config";
import { useFormatResult, useResultFormatter } from "~/hooks/surrealql";
import { useInspector } from "~/providers/Inspector";
import type { PreviewProps } from ".";

export function IndividualPreview({ responses, selected }: PreviewProps) {
	const [format] = useResultFormatter();
	const { inspect } = useInspector();
	const { success, result } = responses[selected] ?? { result: null };
	const [editorScale] = useSetting("appearance", "editorScale");

	const textSize = Math.floor(15 * (editorScale / 100));

	// Use TanStack Query for formatting
	const { data: contents = "" } = useFormatResult(format, result);

	const extensions = useMemo(() => [surrealql(), surqlRecordLinks(inspect)], [inspect]);

	return success ? (
		<CodeEditor
			value={contents}
			readOnly
			extensions={extensions}
		/>
	) : (
		<Text
			pl="md"
			pt="sm"
			fz={textSize}
			c="red"
			ff="mono"
			style={{ whiteSpace: "pre-wrap", userSelect: "text" }}
		>
			{result}
		</Text>
	);
}
