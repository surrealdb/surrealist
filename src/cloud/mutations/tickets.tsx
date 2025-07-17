import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTicketsAPI } from "../api/tickets";
import { CloudTicket, CloudTicketPart, IntercomTicketCreateRequest, IntercomTicketReplyRequest } from "~/types";

/**
 * Ticket creation mutation
 */
export function useCreateTicketMutation(organization: string) {
    const client = useQueryClient();

    return useMutation({
        mutationFn: async (body: IntercomTicketCreateRequest) => {
            const result = await fetchTicketsAPI<CloudTicket>(`/organisations/${organization}/tickets`, {
                method: "POST",
                body: JSON.stringify(body),
            });

            await client.invalidateQueries({
                queryKey: ["cloud", "tickets", organization],
            });

            return result;
        },
    });
}

/**
 * Ticket reply mutation
 */
export function useTicketReplyMutation(organization: string, ticketId: string) {
    const client = useQueryClient();

    return useMutation({
        mutationFn: async (body: IntercomTicketReplyRequest) => {
            const result = await fetchTicketsAPI<CloudTicketPart>(`/organisations/${organization}/tickets/${ticketId}/reply`, {
                method: "POST",
                body: JSON.stringify(body),
            });

            await client.invalidateQueries({
                queryKey: ["cloud", "tickets", organization, ticketId],
            });

            return result;
        },
    });
}

/**
 * Ticket close mutation
 */
export function useTicketCloseMutation(organization: string, ticketId: string) {
    const client = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const result = await fetchTicketsAPI<CloudTicket>(`/organisations/${organization}/tickets/${ticketId}/close`, {
                method: "POST",
            });

            await client.invalidateQueries({
                queryKey: ["cloud", "tickets", organization, ticketId],
            });

            return result;
        },
    });
}
