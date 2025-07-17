import { Group, Paper, Text } from "@mantine/core";
import { TICKET_STATES } from "~/constants";
import { CloudTicketPart, TicketStateId } from "~/types";
import dayjs from "dayjs";
import { TicketPartAuthorDetails } from "../TicketPartAuthorDetails";
import { formatRelativeDate } from "~/util/helpers";
import styles from "./style.module.scss";

export interface TicketPartProps {
    part: CloudTicketPart;
}

export function TicketPartBody({ part }: TicketPartProps) {
    return (
        <Paper p="lg">
            <TicketPartAuthorDetails
                user={part.author}
                updated_at={part.updated_at}
            >
                <div className={styles.intercomContainer} dangerouslySetInnerHTML={{ __html: part.body ?? "" }} />
            </TicketPartAuthorDetails>
        </Paper>
    )
}

export function TicketPart({ part }: TicketPartProps) {
    const created = dayjs(part.created_at * 1000);

    if ((part.part_type === "ticket_state_updated_by_admin" || part.part_type === "ticket_state_updated_by_user")) {
        const state = TICKET_STATES[part.ticket_state as TicketStateId];

        return (
            <Group justify="center" w="100%" gap={4}>
                <Text fz="lg">Ticket marked as</Text>
                <Text fz="lg" fw={600} c={state.color}>{state.label}</Text>
                <Text fz="lg">by</Text>
                <Text fz="lg" c="surreal" fw={600}>{part.author?.name ?? "SurrealDB Team"}</Text>
                <Text fz="lg" c="slate.4">&bull;</Text>
                <Text fz="md" c="slate.4">{formatRelativeDate(part.updated_at * 1000)}</Text>
            </Group>
        )
    } else if (part.part_type === "assignment") {
        return (
            <Group justify="center" w="100%" gap={4}>
                <Text fz="lg">Ticket assigned to</Text>
                <Text fz="lg" c="surreal" fw={600}>{part.assigned_to?.name}</Text>
                <Text fz="lg">by</Text>
                <Text fz="lg" c="surreal" fw={600}>{part.author?.name ?? "SurrealDB Team"}</Text>
                <Text fz="lg" c="slate.4">&bull;</Text>
                <Text fz="md" c="slate.4">{formatRelativeDate(part.updated_at * 1000)}</Text>

            </Group>
        )
    } else if (part.part_type === "open" || part.part_type === "close") {
        const action = part.part_type === "open" ? "Re-opened" : "Closed";
        const color = part.part_type === "open" ? "green" : "red";

        return (
            <>
                <Group justify="center" w="100%" gap={4}>
                    <Text fz="lg">Ticket</Text>
                    <Text fz="lg" c={color} fw={600}>{action}</Text>
                    <Text fz="lg">by</Text>
                    <Text fz="lg" c="surreal" fw={600}>{part.author?.name ?? "SurrealDB Team"}</Text>
                    <Text fz="lg" c="slate.4">&bull;</Text>
                    <Text fz="md" c="slate.4">{formatRelativeDate(part.updated_at * 1000)}</Text>
                </Group>
                {part.body && (
                    <TicketPartBody part={part} />
                )}
            </>
        )
    } else if (part.part_type === "comment") {
        return (
            <TicketPartBody part={part} />
        )
    }

    return undefined;
}