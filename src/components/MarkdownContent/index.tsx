import { BoxProps, TextProps, TypographyStylesProvider } from "@mantine/core";
import clsx from "clsx";
import { PropsWithChildren, ReactElement, useMemo } from "react";
import ReactMarkdown, { Components, Options } from "react-markdown";
import { CodePreview, CodePreviewProps } from "../CodePreview";
import { Link } from "../Link";
import classes from "./style.module.scss";

interface MarkdownContentProps extends BoxProps {
	children?: string | null;
	markdownProps?: Options;
	componentProps?: Partial<{
		link: TextProps;
		code: CodePreviewProps;
	}>;
}

export function MarkdownContent({
	children,
	markdownProps,
	componentProps,
	className,
	...other
}: PropsWithChildren<MarkdownContentProps>) {
	const components = useMemo<Components>(
		() => ({
			a: ({ href, children }) => {
				return (
					<Link
						href={href ?? "#"}
						inherit
						{...componentProps?.link}
					>
						{children}
					</Link>
				);
			},
			pre: ({ children }) => {
				const code = children as ReactElement<HTMLElement>;

				if (code.type !== "code") {
					return children;
				}

				const [_, lang] = /language-(\w+)/.exec(code.props.className) ?? [];
				const content = code.props.children.toString();

				return (
					<CodePreview
						language={lang?.toLowerCase()}
						className={classes.codePreview}
						label={code.props.title}
						value={content}
						withCopy
						{...componentProps?.code}
					/>
				);
			},
			...markdownProps?.components,
		}),
		[markdownProps?.components, componentProps?.link, componentProps?.code],
	);

	return (
		<TypographyStylesProvider
			className={clsx(classes, classes.root)}
			{...other}
		>
			<ReactMarkdown
				components={components}
				{...markdownProps}
			>
				{children}
			</ReactMarkdown>
		</TypographyStylesProvider>
	);
}
