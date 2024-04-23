import classes from "./style.module.scss";
import { Extension } from "@codemirror/state";
import {
	Badge,
	Box,
	Group,
	PaperProps,
	SimpleGrid,
	Title,
} from "@mantine/core";
import { CodePreview } from "~/components/CodePreview";
import { CodeLang } from "~/types";
import { Snippets } from "./types";
import { useMemo } from "react";
import dedent from "dedent";

import { rust } from "@codemirror/lang-rust";
import { javascript } from "@codemirror/lang-javascript";
import { StreamLanguage } from "@codemirror/language";
import { csharp } from "@codemirror/legacy-modes/mode/clike";

export interface ArticleProps {
	title?: React.ReactNode;
	children: React.ReactNode | [React.ReactNode, React.ReactNode];
}

export function Article({ title, children }: ArticleProps) {
	return (
		<Box className={classes.article}>
			{title && (
				<Title mb="sm" c="bright">
					{title}
				</Title>
			)}
			<SimpleGrid cols={2} spacing={64}>
				{children}
			</SimpleGrid>
		</Box>
	);
}

const EXTENSIONS: Partial<Record<CodeLang, Extension>> = {
	rust: rust(),
	js: javascript(),
	csharp: [StreamLanguage.define(csharp)],
};

export interface DocsPreviewProps extends PaperProps {
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

export function TableTitle({
	title,
	table,
}: {
	title: string;
	table: string | undefined;
}) {
	return (
		<Group>
			{title}
			<Badge variant="light">{table}</Badge>
		</Group>
	);
}
