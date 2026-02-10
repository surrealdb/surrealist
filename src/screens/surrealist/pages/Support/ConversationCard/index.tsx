import { Group, Indicator, Stack, Text, ThemeIcon } from "@mantine/core";
import { Icon, iconChat, iconTag } from "@surrealdb/ui";
import { useCloudOrganizationQuery } from "~/cloud/queries/organizations";
import { IntercomConversation } from "~/types";
import { formatRelativeDate } from "~/util/helpers";

export interface ConversationCardProps {
	conversation: IntercomConversation;
}

export function ConversationCard({ conversation }: ConversationCardProps) {
	const htmlRegex = /(<([^>]+)>)/gi;
	const ticketOrganization = conversation.ticketData?.attributes.Organisation;

	const { data: organization } = useCloudOrganizationQuery(ticketOrganization);

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
						{conversation.title?.replace(htmlRegex, "") ||
							`Conversation #${conversation.id}`}
					</Text>
					{!conversation.read && (
						<Indicator
							inset={0}
							size={8}
							color="surreal"
						/>
					)}
				</Group>
				<Group gap={4}>
					<Text c={conversation.hasTicket ? "violet" : "pink"}>
						{conversation.last_response_author?.name || "Unknown"}
					</Text>
					<Text
						c="slate.4"
						fz={4}
						mx={2}
					>
						&#x2B24;
					</Text>
					<Text>{formatRelativeDate(conversation.updated_at * 1000)}</Text>
					{conversation.hasTicket && <Text>in {organization?.name ?? "Unknown"}</Text>}
				</Group>
			</Stack>
		</Group>
	);
}
