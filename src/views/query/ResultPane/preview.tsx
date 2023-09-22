import { useMemo } from "react";
import { SurrealistEditor } from "~/components/SurrealistEditor";
import { useStoreValue } from "~/store";

export interface CombinedJsonPreviewProps {
	results: any[];
	fontSize: number;
}

export function CombinedJsonPreview({ results, fontSize }: CombinedJsonPreviewProps) {
	const wordWrap = useStoreValue((state) => state.config.wordWrap);

	const contents = useMemo(() => {
		return results
			.map(res => JSON.stringify(res, null, 4))
			.reduce((acc, cur, i) => acc + `\n\n// -------- Query ${i + 1} --------\n\n` + cur, '')
			.trim();
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
