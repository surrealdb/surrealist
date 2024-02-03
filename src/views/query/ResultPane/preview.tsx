import { useMemo } from "react";
import { SurrealistEditor } from "~/components/SurrealistEditor";
import { useConfigStore } from "~/stores/config";

function buildResult(index: number, {result, time}: any) {
	const header = `\n\n// -------- Query ${index + 1 + (time ? ` (${time})` : '')} --------\n\n`;
	const content = JSON.stringify(result, null, 4);

	return header + content;
}

export interface CombinedJsonPreviewProps {
	results: any[];
}

export function CombinedJsonPreview({ results }: CombinedJsonPreviewProps) {
	const wordWrap = useConfigStore((s) => s.wordWrap);

	const contents = useMemo(() => {
		return results.reduce((acc, cur, i) => acc + buildResult(i, cur), '').trim();
	}, [results]);

	return (
		<SurrealistEditor
			language="json"
			value={contents}
			options={{
				readOnly: true,
				wordWrap: wordWrap ? "on" : "off"
			}}
		/>
	);
}

export interface SingleJsonPreviewProps {
	result: any;
}

export function SingleJsonPreview({ result }: SingleJsonPreviewProps) {
	const wordWrap = useConfigStore((s) => s.wordWrap);

	const contents = useMemo(() => {
		return JSON.stringify(result, null, 4);
	}, [result]);

	return (
		<SurrealistEditor
			language="json"
			value={contents}
			options={{
				readOnly: true,
				wordWrap: wordWrap ? "on" : "off"
			}}
		/>
	);
}
