import { Badge, Box, Group, SimpleGrid } from "@mantine/core";
import { SectionTitle } from "@surrealdb/ui";
import classes from "./style.module.scss";

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
			{title && <SectionTitle order={2}>{title}</SectionTitle>}
			<SimpleGrid
				cols={2}
				spacing={64}
			>
				{children}
			</SimpleGrid>
		</Box>
	);
}

export function TableTitle({ title, table }: { title: string; table: string | undefined }) {
	return (
		<Group>
			{title}
			<Badge variant="light">{table}</Badge>
		</Group>
	);
}
