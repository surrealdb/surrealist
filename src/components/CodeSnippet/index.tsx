import dedent from "dedent";
import { javascript } from "@codemirror/lang-javascript";
import { php } from "@codemirror/lang-php";
import { rust } from "@codemirror/lang-rust";
import { StreamLanguage } from "@codemirror/language";
import { csharp } from "@codemirror/legacy-modes/mode/clike";
import { Extension } from "@codemirror/state";
import { useMemo } from "react";
import { CodeLang, Snippets } from "~/types";
import { CodePreview, CodePreviewProps } from "../CodePreview";

const EXTENSIONS: Partial<Record<CodeLang, Extension>> = {
	rust: rust(),
	js: javascript(),
	csharp: [StreamLanguage.define(csharp)],
	php: php({ plain: true })
};

export interface CodeSnippetProps extends Omit<CodePreviewProps, 'value'> {
	title?: string;
	values: Snippets;
	language: CodeLang;
}

export function CodeSnippet({
	title,
	values,
	language,
	...other
}: CodeSnippetProps) {
	const snippet = useMemo(() => {
		const value = values[language];
		return value ? dedent(value) : undefined;
	}, [values, language]);

	return (
		<CodePreview
			title={title}
			value={snippet || "No example available for this language"}
			extensions={snippet ? EXTENSIONS[language] : undefined}
			withCopy
			withWrapping
			{...other}
		/>
	);
}