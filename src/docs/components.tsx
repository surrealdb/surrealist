import { Extension } from "@codemirror/state";
import { Box, PaperProps, SimpleGrid, Title } from "@mantine/core";
import { CodePreview } from "~/components/CodePreview";
import { CodeLang } from "~/types";
import { Snippets } from "./types";
import { useMemo } from "react";
import dedent from "dedent";

export interface ArticleProps {
	title: string;
	children: React.ReactNode | [React.ReactNode, React.ReactNode];
}

export function Article({
	title,
	children,
}: ArticleProps) {
	return (
		<Box>
			<Title mb="sm" c="bright">
				{title}
			</Title>
			<SimpleGrid cols={2} spacing={64}>
				{children}
			</SimpleGrid>
		</Box>
	);
}

const EXTENSIONS: Partial<Record<CodeLang, Extension>> = {
	// todo
};

export interface DocsPreviewProps extends PaperProps{
	title: string;
	values: Snippets;
	language: CodeLang;
}

export function DocsPreview({ title, values, language }: DocsPreviewProps) {

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
		/>
	);
}