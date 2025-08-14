import {
	Alert,
	BoxProps,
	Group,
	Menu,
	Paper,
	Text,
	TextProps,
	TypographyStylesProvider,
} from "@mantine/core";
import clsx from "clsx";
import { PropsWithChildren, ReactElement, useMemo } from "react";
import ReactMarkdown, { Components, Options } from "react-markdown";
import { remarkAlert } from "remark-github-blockquote-alert";
import { useConnection } from "~/hooks/connection";
import { useConnectionNavigator } from "~/hooks/routing";
import { useIsLight } from "~/hooks/theme";
import { useConfigStore } from "~/stores/config";
import { createBaseQuery } from "~/util/defaults";
import { iconCopy, iconDotsVertical, iconQuery } from "~/util/icons";
import { ActionButton } from "../ActionButton";
import { CodePreview, CodePreviewOptions } from "../CodePreview";
import { Icon } from "../Icon";
import { Link } from "../Link";
import { extractAlertTitle, filterAlertTitle } from "./helpers";
import classes from "./style.module.scss";

interface MarkdownContentProps extends BoxProps {
	children?: string | null;
	markdownProps?: Options;
	componentProps?: Partial<{
		link: TextProps;
		code: CodePreviewOptions;
	}>;
}

export function MarkdownContent({
	children,
	markdownProps,
	componentProps,
	className,
	...other
}: PropsWithChildren<MarkdownContentProps>) {
	const isLight = useIsLight();
	const navigateConnection = useConnectionNavigator();
	const { connection, queries } = useConnection((c) => {
		return {
			connection: c?.id,
			queries: c?.queries,
		};
	});

	const { settings, updateConnection } = useConfigStore.getState();

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
			div: ({ className, children, ...props }) => {
				const ALERT_COLOR = {
					note: "blue",
					tip: "green",
					important: "violet",
					warning: "yellow",
					caution: "red",
				};

				if (className?.includes("markdown-alert")) {
					const alertType = className?.split("markdown-alert-")[1];
					const color = ALERT_COLOR[alertType as keyof typeof ALERT_COLOR];
					const extractedTitle = extractAlertTitle(children);
					const filteredChildren = filterAlertTitle(children);

					return (
						<Alert
							color={color}
							title={
								extractedTitle ||
								(alertType
									? alertType.charAt(0).toUpperCase() + alertType.slice(1)
									: undefined)
							}
							mb="md"
							{...props}
						>
							{filteredChildren}
						</Alert>
					);
				}

				return (
					<div
						className={className}
						{...props}
					>
						{children}
					</div>
				);
			},
			blockquote: ({ children }) => {
				return (
					<Paper
						p="sm"
						mb="xs"
						bg={
							isLight ? "var(--mantine-color-gray-0)" : "var(--mantine-color-slate-7)"
						}
						radius={0}
						style={{
							border: "none",
							borderLeft: `4px solid var(--mantine-color-surreal-5)`,
						}}
					>
						<Text
							fz="lg"
							className={classes.quote}
						>
							{children}
						</Text>
					</Paper>
				);
			},
			pre: ({ children }) => {
				const element = children as ReactElement<HTMLElement>;
				const [_, lang] = /language-(\w+)/.exec(element.props.className) ?? [];

				if (element?.type !== "code" || !element.props.children || !lang) {
					return "";
				}

				const content = element.props.children.toString();

				if (lang.toLowerCase() === "surrealql") {
					return (
						<CodePreview
							language={lang?.toLowerCase()}
							className={classes.codePreview}
							label={element.props.title}
							value={content}
							{...componentProps?.code}
							rightSection={
								<Menu position="bottom-end">
									<Menu.Target>
										<ActionButton
											label="Menu"
											variant="transparent"
											pos="absolute"
											size="lg"
											top={2.5}
											right={2.5}
											className={classes.copy}
											aria-label="Copy code to clipboard"
											onMouseOver={(e) => {
												e.currentTarget.style.background =
													"linear-gradient(135deg, var(--mantine-color-surreal-4), #9600FF)";
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.background = "transparent";
											}}
										>
											<Icon path={iconDotsVertical} />
										</ActionButton>
									</Menu.Target>
									<Menu.Dropdown>
										<Menu.Item
											disabled={!connection}
											style={{
												zIndex: 6,
											}}
											onClick={() => {
												if (connection) {
													const query = createBaseQuery(
														settings,
														"config",
													);

													updateConnection({
														id: connection,
														queries: [
															...(queries ?? []),
															{
																...query,
																name: "Sidekick Query",
																query: content,
															},
														],
														activeQuery: query.id,
													});

													navigateConnection(connection, "query");
												}
											}}
										>
											<Group>
												<Icon path={iconQuery} />
												<Text>Open in new query tab</Text>
											</Group>
										</Menu.Item>
										<Menu.Item
											style={{
												zIndex: 6,
											}}
											onClick={() => {
												navigator.clipboard.writeText(content);
											}}
										>
											<Group>
												<Icon path={iconCopy} />
												<Text>Copy to clipboard</Text>
											</Group>
										</Menu.Item>
									</Menu.Dropdown>
								</Menu>
							}
						/>
					);
				}

				return (
					<CodePreview
						language={lang?.toLowerCase()}
						className={classes.codePreview}
						label={element.props.title}
						value={content}
						withCopy
						{...componentProps?.code}
					/>
				);
			},
			...markdownProps?.components,
		}),
		[
			markdownProps?.components,
			componentProps?.link,
			componentProps?.code,
			connection,
			queries,
			settings,
			updateConnection,
			isLight,
		],
	);

	return (
		<TypographyStylesProvider
			className={clsx(classes, classes.root)}
			{...other}
		>
			<ReactMarkdown
				components={components}
				remarkPlugins={[
					[
						remarkAlert,
						{
							legacyTitle: true,
						},
					],
				]}
				{...markdownProps}
			>
				{children}
			</ReactMarkdown>
		</TypographyStylesProvider>
	);
}
