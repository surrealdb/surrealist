import classes from "./style.module.scss";

import {
	Avatar,
	Flex,
	Group,
	Image,
	List,
	Loader,
	Paper,
	Text,
	TypographyStylesProvider,
} from "@mantine/core";

import sidekickImg from "~/assets/images/sidekick.webp";

import { marked } from "marked";
import { Link } from "~/components/Link";
import { useIsLight } from "~/hooks/theme";
import type { CloudChatMessage, CloudProfile } from "~/types";

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
		<Flex
			justify={message.sender === "user" ? "end" : "start"}
			direction={message.sender === "user" ? "row-reverse" : "row"}
			gap="md"
		>
			{message.sender === "assistant" ? (
				<SidekickAvatar />
			) : (
				<Avatar
					radius="md"
					size={40}
					name={profile.name}
					src={profile.picture}
				/>
			)}
			{message.loading ? (
				<Group>
					<Loader
						size={14}
						color="slate.5"
					/>
					<Text
						size="lg"
						c="white"
					>
						{message.thinking}
					</Text>
				</Group>
			) : (
				<Paper
					px="lg"
					py="sm"
					maw="80%"
					bg={
						message.sender === "user"
							? isLight
								? "slate.1"
								: "slate.6"
							: isLight
								? "white"
								: "slate.8"
					}
				>
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
				</Paper>
			)}
		</Flex>
	);
}

function SidekickAvatar() {
	const isLight = useIsLight();

	return (
		<Avatar
			radius="md"
			variant={isLight ? "filled" : "light"}
			color="surreal"
			size={40}
		>
			<Image
				src={sidekickImg}
				w={28}
				h={28}
			/>
		</Avatar>
	);
}
