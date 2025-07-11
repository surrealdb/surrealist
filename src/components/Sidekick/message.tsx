import classes from "./style.module.scss";

import {
	Avatar,
	Box,
	Group,
	Image,
	List,
	Loader,
	Paper,
	Text,
	TypographyStylesProvider,
} from "@mantine/core";

import { marked } from "marked";
import type { CloudChatMessage, CloudProfile } from "~/types";
import { ActionButton } from "../ActionButton";
import { iconAccount, iconCopy, iconDotsVertical, iconSidekick } from "~/util/icons";
import { Icon } from "../Icon";
import { Link } from "~/components/Link";
import { Spacer } from "../Spacer";

export interface ChatMessageProps {
	message: CloudChatMessage;
	profile: CloudProfile;
	lastResponse: string;
	isResponding: boolean;
	isLight: boolean;
}

export function ChatMessage({
	message,
	profile,
	lastResponse,
	isResponding,
	isLight,
}: ChatMessageProps) {
	return (
		<Box className={classes.message}>
			{message.sender === "user" ? (
				<>
					<Group
						gap="xs"
						mb="sm"
					>
						<Icon
							path={iconAccount}
							size="sm"
						/>
						<Text>{profile.name}</Text>
						<Spacer />
						<ActionButton
							label={"Options"}
							variant="subtle"
							size="sm"
						>
							<Icon
								path={iconDotsVertical}
								size="sm"
							/>
						</ActionButton>
						<ActionButton
							label={"Copy"}
							variant="subtle"
							size="sm"
						>
							<Icon
								path={iconCopy}
								size="sm"
							/>
						</ActionButton>
					</Group>
					<Paper
						p="md"
						bg="slate.6"
					>
						<Group>
							<Avatar
								radius="xs"
								size="sm"
								name={profile.name}
								src={profile.picture}
							/>
							<MessageContent message={message} />
						</Group>
					</Paper>
				</>
			) : (
				<Box>
					<Group
						gap="xs"
						mb="sm"
					>
						{message.loading ? (
							<Loader
								size={14}
								color={isLight ? "slate.5" : "slate.4"}
							/>
						) : (
							<Icon
								path={iconSidekick}
								size="sm"
							/>
						)}
						<Text>{message.loading ? message.thinking : "Sidekick"}</Text>
						<Spacer />
						<ActionButton
							label={"Options"}
							variant="subtle"
							size="sm"
						>
							<Icon
								path={iconDotsVertical}
								size="sm"
							/>
						</ActionButton>
						<ActionButton
							label={"Copy"}
							variant="subtle"
							size="sm"
						>
							<Icon
								path={iconCopy}
								size="sm"
							/>
						</ActionButton>
					</Group>
					<MessageContent message={message} />
					{message.sources && message.sources.links.length > 0 && (
						<Paper
							bg={isLight ? "slate.0" : "slate.7"}
							mt="xl"
							p="md"
						>
							<Text
								fz="lg"
								fw={500}
							>
								{message.sources.header}
							</Text>
							<List mt="sm">
								{message.sources.links.map((item, i) => (
									<List.Item
										key={i}
										icon={
											<Image
												src={item.img_url}
												radius={4}
												w={18}
												h={18}
											/>
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
					{message.id === lastResponse && !isResponding && (
						<Text
							mt="md"
							fz="xs"
							c="slate"
						>
							This response may be incorrect. Help us improve the docs by{" "}
							<Link
								fz="xs"
								href="https://github.com/surrealdb/docs.surrealdb.com"
							>
								clicking here
							</Link>
						</Text>
					)}
				</Box>
			)}
		</Box>
	);
}

function MessageContent({ message }: { message: CloudChatMessage }) {
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
