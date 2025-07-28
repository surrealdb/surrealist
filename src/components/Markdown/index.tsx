import { Text, TextProps } from "@mantine/core";
import { PropsWithChildren } from "react";
import ReactMarkdown from "react-markdown";
import { CodePreview } from "../CodePreview";
import { Link } from "../Link";

import classes from "./style.module.scss";

interface MarkdownProps {
	content: string;
	componentProps: {
		link?: TextProps;
	};
}

export default function Markdown({
	content,
	componentProps,
	...rest
}: PropsWithChildren<MarkdownProps>) {
	return (
		<div
			style={{
				userSelect: "text",
			}}
		>
			<ReactMarkdown
				components={{
					a: ({ href, children }) => {
						if (href) {
							return (
								<Link
									href={href}
									{...componentProps.link}
								>
									{children}
								</Link>
							);
						} else {
							return <Text {...componentProps.link}>{children}</Text>;
						}
					},
					code: ({ children, className, ...rest }) => {
						const lang = className
							?.split(" ")
							.find((cls) => cls.startsWith("language-"))
							?.replace("language-", "");

						if (lang && lang !== "undefined" && children) {
							return (
								<CodePreview
									language={lang?.toLowerCase()}
									value={children as string}
									withCopy
									copyOffset={-2.5}
									copySize="md"
									bg="transparent"
									padding={0}
									withBorder={false}
									className={classes.pre}
								/>
							);
						} else {
							return (
								<code
									style={{
										color: "var(--mantine-color-surreal-5)",
									}}
									{...rest}
								>
									{children}
								</code>
							);
						}
					},
				}}
				{...rest}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
