import { useMemo } from "react";
import type { CodeLang, Snippets } from "~/types";
import { dedent } from "~/util/dedent";
import { CodePreview, type CodePreviewProps } from "../CodePreview";

export interface CodeSnippetProps extends Omit<CodePreviewProps, "value"> {
	title?: string;
	values: Snippets;
	language: CodeLang;
}

export function CodeSnippet({ title, values, language, ...other }: CodeSnippetProps) {
	const snippet = useMemo(() => {
		const value = values[language];
		return value ? dedent(value) : undefined;
	}, [values, language]);

	return (
		<CodePreview
			label={title}
			value={snippet || "No example available for this language"}
			language={language}
			withCopy
			{...other}
		/>
	);
}
