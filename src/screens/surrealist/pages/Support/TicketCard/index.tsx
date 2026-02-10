import { Group, Stack, Text, ThemeIcon } from "@mantine/core";
import { Icon, iconTag } from "@surrealdb/ui";
import { IntercomTicket } from "~/types";
import { formatRelativeDate } from "~/util/helpers";

export interface TicketCardProps {
	ticket: IntercomTicket;
}

export function TicketCard({ ticket }: TicketCardProps) {
	const htmlRegex = /(<([^>]+)>)/gi;
	return (
		<Group gap="md">
			<ThemeIcon
				size={40}
				variant="light"
				color="violet"
			>
				<Icon path={iconTag} />
			</ThemeIcon>
			<Stack gap={2.5}>
				<Group>
					<Text
						fz="lg"
						fw={400}
						c="bright"
					>
						{ticket.title.replace(htmlRegex, "")}
					</Text>
				</Group>
				<Group gap="xs">
					<Text c="violet">
						{ticket.parts[ticket.parts.length - 1]?.author?.name || "Unknown"}
					</Text>
					<Text
						c="slate.4"
						fz={4}
					>
						&#x2B24;
					</Text>
					<Text>{formatRelativeDate(ticket.updated_at * 1000)}</Text>
				</Group>
			</Stack>
		</Group>
	);
}
