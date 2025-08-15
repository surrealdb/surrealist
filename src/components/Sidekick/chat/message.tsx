import {
	ActionIcon,
	Avatar,
	Box,
	Collapse,
	CopyButton,
	Group,
	List,
	Loader,
	Paper,
	Stack,
	Text,
} from "@mantine/core";
import { useState } from "react";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { Link } from "~/components/Link";
import { MarkdownContent } from "~/components/MarkdownContent";
import { RelativeTime } from "~/components/RelativeTime";
import { Spacer } from "~/components/Spacer";
import { useIsLight } from "~/hooks/theme";
import { SidekickChatMessage } from "~/types";
import { iconArrowLeft, iconCheck, iconChevronDown, iconChevronUp, iconCopy } from "~/util/icons";
import classes from "../style.module.scss";

export interface SidekickMessageProps {
	message: SidekickChatMessage;
	isResponding?: boolean;
	thinkingText?: string;
}

export function SidekickMessage({ message, thinkingText, isResponding }: SidekickMessageProps) {
	const isLight = useIsLight();
	const [sourcesOpen, setSourcesOpen] = useState(false);

	const validSources = message.sources?.links.filter((link) => link.title && link.url) ?? [];

	return (
		<Box className={classes.message}>
			{message.role === "user" ? (
				<>
					<Paper
						p="md"
						bg={isLight ? "slate.1" : "slate.6"}
					>
						<MarkdownContent fz="lg">{message.content}</MarkdownContent>
					</Paper>
					<Group
						mt={2}
						gap="xs"
					>
						<Spacer />
						<Text
							c="slate"
							fz="sm"
						>
							<RelativeTime value={message.sent_at.valueOf()} />
						</Text>
						<CopyButton value={message.content}>
							{({ copied, copy }) => (
								<ActionButton
									color="slate"
									variant="transparent"
									onClick={copy}
									label={copied ? "Copied" : "Copy"}
								>
									<Icon
										path={copied ? iconCheck : iconCopy}
										size="sm"
									/>
								</ActionButton>
							)}
						</CopyButton>
					</Group>
				</>
			) : (
				<Box mb="xl">
					{message.content ? (
						<MarkdownContent fz="lg">{message.content}</MarkdownContent>
					) : (
						<Group
							gap="xs"
							c="slate"
						>
							<Loader
								size={14}
								color="currentColor"
							/>
							<Text
								fz="lg"
								fw={400}
								inherit
							>
								{thinkingText || "Thinking..."}
							</Text>
						</Group>
					)}
					{!isResponding && (
						<Group
							mt="xs"
							gap="xs"
						>
							<CopyButton value={message.content}>
								{({ copied, copy }) => (
									<ActionButton
										size="sm"
										color="slate"
										variant="transparent"
										onClick={copy}
										label={copied ? "Copied" : "Copy"}
									>
										<Icon
											path={copied ? iconCheck : iconCopy}
											size="sm"
										/>
									</ActionButton>
								)}
							</CopyButton>
							<Text
								c="slate"
								fz="sm"
							>
								<RelativeTime value={message.sent_at.valueOf()} />
							</Text>
						</Group>
					)}
					{validSources.length > 0 && (
						<Stack mt="xl">
							<Group
								gap={0}
								onClick={() => setSourcesOpen(!sourcesOpen)}
							>
								<Text
									c="surreal"
									fw={500}
								>
									{message.sources?.header ?? "Sources"}
								</Text>
								<ActionIcon
									c="surreal"
									variant="transparent"
									size="sm"
								>
									<Icon path={sourcesOpen ? iconChevronUp : iconChevronDown} />
								</ActionIcon>
							</Group>
							<Collapse in={sourcesOpen}>
								<Paper
									bg={isLight ? "slate.0" : "slate.7"}
									p="md"
								>
									<List>
										{validSources.map((item, i) => (
											<List.Item
												key={i}
												icon={
													<Avatar
														src={item.img_url}
														color="violet"
														radius={4}
														size={18}
														styles={{
															image: {
																objectFit: "contain",
															},
														}}
													>
														<Icon
															path={iconArrowLeft}
															flip="horizontal"
														/>
													</Avatar>
												}
											>
												<Link
													href={item.url}
													c="bright"
												>
													{item.title}
												</Link>
											</List.Item>
										))}
									</List>
								</Paper>
							</Collapse>
						</Stack>
					)}
				</Box>
			)}
		</Box>
	);
}
