import {
	Avatar,
	Box,
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
import { Link } from "~/components/Link";
import { Spacer } from "~/components/Spacer";
import { useIsLight } from "~/hooks/theme";
import { CloudProfile, SidekickChatMessage } from "~/types";
import { iconArrowLeft, iconCopy, iconDotsVertical, iconSidekick } from "~/util/icons";
import classes from "../style.module.scss";

export interface SidekickMessageProps {
	message: SidekickChatMessage;
	profile: CloudProfile;
	isResponding?: boolean;
	thinkingText?: string;
}

export function SidekickMessage({
	message,
	profile,
	thinkingText,
	isResponding,
}: SidekickMessageProps) {
	const isLight = useIsLight();

	return (
		<Box className={classes.sidekickMessage}>
			{message.role === "user" ? (
				<>
					<Group
						gap="xs"
						mb="sm"
					>
						<Avatar
							radius="xs"
							size={22}
							name={profile.name}
							src={profile.picture}
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
						<MessageContent message={message} />
					</Paper>
				</>
			) : (
				<Box>
					<Group
						gap="xs"
						mb="sm"
					>
						{isResponding ? (
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
						<Text>{isResponding ? thinkingText || "Thinking..." : "Sidekick"}</Text>
						<Spacer />
						<ActionButton
							label="Options"
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
					{/* {message.id === lastResponse && !isResponding && (
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
					)} */}
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
