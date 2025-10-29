import { Group, Indicator, Stack, Text, ThemeIcon } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { IntercomConversation } from "~/types";
import { formatRelativeDate } from "~/util/helpers";
import { iconChat, iconTag } from "~/util/icons";

export interface ConversationCardProps {
	conversation: IntercomConversation;
}

export function ConversationCard({ conversation }: ConversationCardProps) {
	const htmlRegex = /(<([^>]+)>)/gi;
	return (
		<Group gap="md">
			{conversation.hasTicket && (
				<ThemeIcon
					size={40}
					variant="light"
					color="violet"
				>
					<Icon path={iconTag} />
				</ThemeIcon>
			)}
			{!conversation.hasTicket && (
				<ThemeIcon
					size={40}
					variant="light"
					color="pink"
				>
					<Icon path={iconChat} />
				</ThemeIcon>
			)}
			<Stack gap={2.5}>
				<Group>
					<Text
						fz="lg"
						fw={conversation.read ? 400 : 600}
						c="bright"
					>
						{conversation.title.replace(htmlRegex, "")}
					</Text>
					{!conversation.read && (
						<Indicator
							inset={0}
							size={8}
							color="surreal"
						/>
					)}
				</Group>
				<Group gap="xs">
					<Text c={conversation.hasTicket ? "violet" : "pink"}>
						{conversation.last_response_author?.name || "Unknown"}
					</Text>
					<Text
						c="slate.4"
						fz={4}
					>
						&#x2B24;
					</Text>
					<Text>{formatRelativeDate(conversation.updated_at * 1000)}</Text>
				</Group>
			</Stack>
		</Group>
	);
}
