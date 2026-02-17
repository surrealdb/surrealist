import { CodeBlock, CodeBlockProps } from "@surrealdb/ui";
import { useMemo } from "react";
import type { CodeLang, Snippets } from "~/types";
import { dedent } from "~/util/dedent";

export interface CodeSnippetProps extends Omit<CodeBlockProps, "value"> {
	values: Snippets;
	language: CodeLang;
	editorLanguage?: string;
}

export function CodeSnippet({ values, language, editorLanguage, ...other }: CodeSnippetProps) {
	const snippet = useMemo(() => {
		const value = values[language];
		return value ? dedent(value) : undefined;
	}, [values, language]);

	return (
		<CodeBlock
			value={snippet || "No example available for this language"}
			lang={editorLanguage || language}
			{...other}
		/>
	);
}
