import { javascript } from "@codemirror/lang-javascript";
import { php } from "@codemirror/lang-php";
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import { StreamLanguage } from "@codemirror/language";
import { csharp, java } from "@codemirror/legacy-modes/mode/clike";
import type { Extension } from "@codemirror/state";
import { useMemo } from "react";
import type { CodeLang, Snippets } from "~/types";
import { dedent } from "~/util/dedent";
import { CodePreview, type CodePreviewProps } from "../CodePreview";

const EXTENSIONS: Partial<Record<CodeLang, Extension>> = {
	rust: rust(),
	js: javascript(),
	py: python(),
	java: StreamLanguage.define(java),
	csharp: StreamLanguage.define(csharp),
	php: php({ plain: true }),
};

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
			title={title}
			value={snippet || "No example available for this language"}
			extensions={snippet ? EXTENSIONS[language] : undefined}
			withCopy
			withWrapping
			{...other}
		/>
	);
}
