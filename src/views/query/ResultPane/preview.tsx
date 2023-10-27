import { useMemo } from "react";
import { SurrealistEditor } from "~/components/SurrealistEditor";
import { useStoreValue } from "~/store";

function buildResult(index: number, {result, time}: any) {
	const header = `\n\n// -------- Query ${index + 1 + (time ? ` (${time})` : '')} --------\n\n`;
	const content = JSON.stringify(result, null, 4);

	return header + content;
}

export interface CombinedJsonPreviewProps {
	results: any[];
	fontSize: number;
}

export function CombinedJsonPreview({ results, fontSize }: CombinedJsonPreviewProps) {
	const wordWrap = useStoreValue((state) => state.config.wordWrap);

	const contents = useMemo(() => {
		return results.reduce((acc, cur, i) => acc + buildResult(i, cur), '').trim();
	}, [results]);

	return (
		<SurrealistEditor
			language="json"
			value={contents}
			options={{
				readOnly: true,
				wordWrap: wordWrap ? "on" : "off",
				fontSize,
			}}
		/>
	);
}

export interface SingleJsonPreviewProps {
	result: any;
	fontSize: number;
}

export function SingleJsonPreview({ result, fontSize }: SingleJsonPreviewProps) {
	const wordWrap = useStoreValue((state) => state.config.wordWrap);

	const contents = useMemo(() => {
		return JSON.stringify(result, null, 4);
	}, [result]);

	return (
		<SurrealistEditor
			language="json"
			value={contents}
			options={{
				readOnly: true,
				wordWrap: wordWrap ? "on" : "off",
				fontSize,
			}}
		/>
	);
}
