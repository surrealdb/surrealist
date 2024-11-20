import classes from "./style.module.scss";

import { Badge, Box, Group, SimpleGrid, Title } from "@mantine/core";

export {
	CodeSnippet as DocsPreview,
	type CodeSnippetProps as DocsPreviewProps,
} from "~/components/CodeSnippet";

export interface ArticleProps {
	title?: React.ReactNode;
	children: React.ReactNode | [React.ReactNode, React.ReactNode];
}

export function Article({ title, children }: ArticleProps) {
	return (
		<Box className={classes.article}>
			{title && (
				<Title
					mb="sm"
					c="bright"
				>
					{title}
				</Title>
			)}
			<SimpleGrid
				cols={2}
				spacing={64}
			>
				{children}
			</SimpleGrid>
		</Box>
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
