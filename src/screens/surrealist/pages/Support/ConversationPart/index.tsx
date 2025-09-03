import { Group, Paper, Text } from "@mantine/core";
import { TICKET_STATES } from "~/constants";
import { IntercomConversation, IntercomConversationPart, IntercomTicketStateId } from "~/types";
import { formatRelativeDate } from "~/util/helpers";
import { ConversationPartAuthor } from "../ConversationPartAuthor";
import styles from "./style.module.scss";

export interface ConversationPartProps {
	conversation: IntercomConversation;
	part: IntercomConversationPart;
}

export function ConversationPartBody({ part }: ConversationPartProps) {
	return (
		<Paper
			p="lg"
			bg="slate.7"
		>
			<ConversationPartAuthor
				user={part.author}
				updated_at={part.updated_at}
			>
				<div
					className={styles.intercomContainer}
					// biome-ignore lint/security/noDangerouslySetInnerHtml: Required since Intercom returns HTML
					dangerouslySetInnerHTML={{ __html: part.body ?? "" }}
				/>
			</ConversationPartAuthor>
		</Paper>
	);
}

export function ConversationPart({ conversation, part }: ConversationPartProps) {
	if (
		part.part_type === "ticket_state_updated_by_admin" ||
		part.part_type === "ticket_state_updated_by_user"
	) {
		const ticketPart = conversation.ticketData?.parts.find((it) => it.id === part.id);

		if (!ticketPart) {
			return undefined;
		}

		const state = TICKET_STATES[ticketPart.ticket_state as IntercomTicketStateId];

		return (
			<Group
				justify="center"
				w="100%"
				gap={4}
			>
				<Text fz="lg">Ticket marked as</Text>
				<Text
					fz="lg"
					fw={600}
					c={state.color}
				>
					{state.label}
				</Text>
				<Text fz="lg">by</Text>
				<Text
					fz="lg"
					c="surreal"
					fw={600}
				>
					{part.author?.name ?? "SurrealDB Team"}
				</Text>
				<Text
					fz="lg"
					c="slate.4"
				>
					&bull;
				</Text>
				<Text
					fz="md"
					c="slate.4"
				>
					{formatRelativeDate(part.updated_at * 1000)}
				</Text>
			</Group>
		);
	}
	if (part.part_type === "assignment" || part.part_type === "bulk_reassignment") {
		if (part.assigned_to === null) {
			return undefined;
		}

		const selfAssigned = part.assigned_to.id === part.author.id;

		return (
			<Group
				justify="center"
				w="100%"
				gap={4}
			>
				<Text fz="lg">Ticket {selfAssigned ? "self-" : ""}assigned to</Text>
				<Text
					fz="lg"
					c="surreal"
					fw={600}
				>
					{part.assigned_to?.name}
				</Text>
				{!selfAssigned && (
					<>
						<Text fz="lg">by</Text>
						<Text
							fz="lg"
							c="surreal"
							fw={600}
						>
							{part.author?.name ?? "SurrealDB Team"}
						</Text>
					</>
				)}
				<Text
					fz="lg"
					c="slate.4"
				>
					&bull;
				</Text>
				<Text
					fz="md"
					c="slate.4"
				>
					{formatRelativeDate(part.updated_at * 1000)}
				</Text>
			</Group>
		);
	}
	if (part.part_type === "open" || part.part_type === "close") {
		const action = part.part_type === "open" ? "Re-opened" : "Closed";
		const color = part.part_type === "open" ? "green" : "red";

		return (
			<>
				<Group
					justify="center"
					w="100%"
					gap={4}
				>
					<Text fz="lg">Ticket</Text>
					<Text
						fz="lg"
						c={color}
						fw={600}
					>
						{action}
					</Text>
					<Text fz="lg">by</Text>
					<Text
						fz="lg"
						c="surreal"
						fw={600}
					>
						{part.author?.name ?? "SurrealDB Team"}
					</Text>
					<Text
						fz="lg"
						c="slate.4"
					>
						&bull;
					</Text>
					<Text
						fz="md"
						c="slate.4"
					>
						{formatRelativeDate(part.updated_at * 1000)}
					</Text>
				</Group>
				{part.body && (
					<ConversationPartBody
						conversation={conversation}
						part={part}
					/>
				)}
			</>
		);
	}
	if (part.part_type === "comment" || part.part_type === "initial") {
		return (
			<ConversationPartBody
				conversation={conversation}
				part={part}
			/>
		);
	}

	return undefined;
}
