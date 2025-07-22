import {
	Avatar,
	Box,
	CopyButton,
	Group,
	List,
	Loader,
	Paper,
	Text,
	TypographyStylesProvider,
} from "@mantine/core";
import { marked } from "marked";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { Link } from "~/components/Link";
import { RelativeTime } from "~/components/RelativeTime";
import { Spacer } from "~/components/Spacer";
import { useIsLight } from "~/hooks/theme";
import { SidekickChatMessage } from "~/types";
import { iconArrowLeft, iconCheck, iconCopy } from "~/util/icons";
import classes from "../style.module.scss";

export interface SidekickMessageProps {
	message: SidekickChatMessage;
	isResponding?: boolean;
	thinkingText?: string;
}

export function SidekickMessage({ message, thinkingText, isResponding }: SidekickMessageProps) {
	const isLight = useIsLight();

	const validSources = message.sources?.links.filter((link) => link.title && link.url) ?? [];

	return (
		<Box className={classes.message}>
			{message.role === "user" ? (
				<>
					<Paper
						p="md"
						bg="slate.6"
					>
						<MessageContent message={message} />
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
						<MessageContent message={message} />
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
					{validSources.length > 0 && (
						<Paper
							bg={isLight ? "slate.0" : "slate.7"}
							mt="xl"
							p="md"
						>
							<Label>{message.sources?.header ?? "Sources"}</Label>
							<List mt="sm">
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
				</Box>
			)}
		</Box>
	);
}

function MessageContent({ message }: { message: SidekickChatMessage }) {
	return (
		<TypographyStylesProvider
			fz="lg"
			fw={400}
			c="bright"
			className={classes.message}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: Markdown response
			dangerouslySetInnerHTML={{
				__html: marked(message.content),
			}}
		/>
	);
}
