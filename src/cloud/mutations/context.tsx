import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	IntercomConversation,
	IntercomConversationCreateRequest,
	IntercomConversationReplyRequest,
	IntercomConversationStateRequest,
	IntercomTicket,
	IntercomTicketCreateRequest,
} from "~/types";
import { fetchContextAPI } from "../api/context";

/**
 * Ticket creation mutation
 */
export function useCreateTicketMutation(organization: string) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (body: IntercomTicketCreateRequest) => {
			const result = await fetchContextAPI<IntercomTicket>(
				`/cloud/org/${organization}/tickets`,
				{
					method: "POST",
					body: JSON.stringify(body),
				},
			);

			await client.invalidateQueries({
				queryKey: ["cloud", "conversations"],
			});

			return result;
		},
	});
}

/**
 * Conversation creation mutation
 */
export function useConversationCreateMutation() {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (body: IntercomConversationCreateRequest) => {
			const result = await fetchContextAPI<IntercomConversation>(`/cloud/conversations`, {
				method: "POST",
				body: JSON.stringify(body),
			});

			await client.invalidateQueries({
				queryKey: ["cloud", "conversations"],
			});

			return result;
		},
	});
}

/**
 * Conversation reply mutation
 */
export function useConversationReplyMutation(conversationId?: string) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (body: IntercomConversationReplyRequest) => {
			if (!conversationId) {
				throw new Error("Conversation ID is required");
			}

			const result = await fetchContextAPI<IntercomConversation>(
				`/cloud/conversations/${conversationId}/${conversationId}/reply`,
				{
					method: "POST",
					body: JSON.stringify(body),
				},
			);

			await client.invalidateQueries({
				queryKey: ["cloud", "conversations", conversationId],
			});

			return result;
		},
	});
}

/**
 * Update a conversation's read state
 */
export function useConversationStateMutation() {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (request: IntercomConversationStateRequest) => {
			const result = await fetchContextAPI<IntercomConversation>(
				`/cloud/conversations/${request.conversationId}/mark_as/${request.state}`,
				{
					method: "PATCH",
				},
			);

			await client.invalidateQueries({
				queryKey: ["cloud", "conversations", request.conversationId],
			});

			return result;
		},
	});
}

/**
 * Ticket close mutation
 */
export function useTicketStateMutation(ticketId: string, stateId: "open" | "close") {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			const result = await fetchContextAPI<IntercomTicket>(
				`/cloud/tickets/${ticketId}/${stateId}`,
				{
					method: "PATCH",
				},
			);

			await client.invalidateQueries({
				queryKey: ["cloud", "conversations", ticketId],
			});

			return result;
		},
	});
}
