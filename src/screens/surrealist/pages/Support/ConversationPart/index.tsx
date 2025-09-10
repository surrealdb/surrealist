import { Group, Paper, Stack, Text, ThemeIcon } from "@mantine/core";
import { adapter } from "~/adapter";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { IntercomConversation, IntercomConversationPart } from "~/types";
import { formatFileSize, formatRelativeDate } from "~/util/helpers";
import { iconFile } from "~/util/icons";
import { ConversationPartAuthor } from "../ConversationPartAuthor";
import styles from "./style.module.scss";

export interface ConversationPartProps {
	conversation: IntercomConversation;
	part: IntercomConversationPart;
	initial?: boolean;
}

export function ConversationPartBody({ conversation, part, initial }: ConversationPartProps) {
	console.log(part.attachments);
	return (
		<Paper
			w="100%"
			p="lg"
			bg="slate.7"
		>
			<ConversationPartAuthor
				user={part.author}
				updated_at={part.updated_at}
			>
				{part.attachments?.map((it) => (
					<Paper
						key={it.url}
						p="sm"
						bg="slate.8"
						w="fit-content"
						withBorder={false}
						style={{
							cursor: "pointer",
						}}
						onClick={() => {
							adapter.openUrl(it.url);
						}}
					>
						<Group>
							<ThemeIcon
								size="lg"
								variant="light"
								color="slate"
							>
								<Icon path={iconFile} />
							</ThemeIcon>
							<Stack gap={0}>
								<Text
									fw={600}
									fz="md"
								>
									{it.name}
								</Text>
								<Text
									fz="sm"
									c="slate.4"
								>
									{formatFileSize(it.filesize)}
								</Text>
							</Stack>
						</Group>
					</Paper>
				))}
				<div
					className={styles.intercomContainer}
					// biome-ignore lint/security/noDangerouslySetInnerHtml: Required since Intercom returns HTML
					dangerouslySetInnerHTML={{ __html: part.body ?? "" }}
				/>
				{initial &&
					conversation.hasTicket &&
					Object.entries(conversation.ticketData?.attributes ?? {}).map(
						([name, value]) => (
							<Group key={name}>
								<PrimaryTitle
									fz="lg"
									fw={600}
								>
									{name}
								</PrimaryTitle>
								<Text>{value}</Text>
							</Group>
						),
					)}
			</ConversationPartAuthor>
		</Paper>
	);
}

export function ConversationPart({ conversation, part, initial }: ConversationPartProps) {
	if (
		part.part_type === "conversation_attribute_updated_by_admin" ||
		part.part_type === "conversation_attribute_updated_by_user"
	) {
		return (
			<Group
				justify="center"
				w="100%"
				gap={4}
			>
				<Text fz="lg">Conversation attributes updated by</Text>
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

	if (
		part.part_type === "ticket_state_updated_by_admin" ||
		part.part_type === "ticket_state_updated_by_user"
	) {
		const ticketPart = conversation.ticketData?.parts.find((it) => it.id === part.id);

		if (!ticketPart) {
			return undefined;
		}

		return (
			<Group
				justify="center"
				w="100%"
				gap={4}
			>
				<Text fz="lg">Moved to</Text>
				<Text
					fz="lg"
					fw={600}
					c="bright"
				>
					{ticketPart.state.label}
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
				<Text fz="lg">{selfAssigned ? "Self-" : ""}Assigned to</Text>
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
		const action = part.part_type === "open" ? "Open" : "Closed";
		const color = part.part_type === "open" ? "green" : "red";

		return (
			<>
				<Group
					justify="center"
					w="100%"
					gap={4}
				>
					<Text fz="lg">Marked as</Text>
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
				initial={initial}
			/>
		);
	}

	return undefined;
}
