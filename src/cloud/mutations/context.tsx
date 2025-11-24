import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupportTicketsEnvironment } from "~/hooks/context";
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
export function useCreateTicketMutation(organization?: string) {
	const client = useQueryClient();
	const env = useSupportTicketsEnvironment();

	return useMutation({
		mutationFn: async (body: IntercomTicketCreateRequest) => {
			if (!organization) {
				throw new Error("Organization is required");
			}

			const result = await fetchContextAPI<IntercomTicket>(
				`/cloud/org/${organization}/tickets`,
				env,
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
	const env = useSupportTicketsEnvironment();

	return useMutation({
		mutationFn: async (body: IntercomConversationCreateRequest) => {
			const result = await fetchContextAPI<IntercomConversation>(
				`/cloud/conversations`,
				env,
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
 * Conversation reply mutation
 */
export function useConversationReplyMutation(conversationId?: string) {
	const client = useQueryClient();
	const env = useSupportTicketsEnvironment();

	return useMutation({
		mutationFn: async (body: IntercomConversationReplyRequest) => {
			if (!conversationId) {
				throw new Error("Conversation ID is required");
			}

			const result = await fetchContextAPI<IntercomConversation>(
				`/cloud/conversations/${conversationId}/reply`,
				env,
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
 * Conversation reopen mutation
 */
export function useConversationReopenMutation(conversationId?: string) {
	const client = useQueryClient();
	const env = useSupportTicketsEnvironment();

	return useMutation({
		mutationFn: async (message: string) => {
			if (!conversationId) {
				throw new Error("Conversation ID is required");
			}

			const result = await fetchContextAPI<IntercomConversation>(
				`/cloud/conversations/${conversationId}/reopen`,
				env,
				{
					method: "POST",
					body: JSON.stringify({
						body: message,
					}),
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
	const env = useSupportTicketsEnvironment();

	return useMutation({
		mutationFn: async (request: IntercomConversationStateRequest) => {
			const result = await fetchContextAPI<IntercomConversation>(
				`/cloud/conversations/${request.conversationId}/mark_as/${request.state}`,
				env,
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
	const env = useSupportTicketsEnvironment();

	return useMutation({
		mutationFn: async () => {
			const result = await fetchContextAPI<IntercomTicket>(
				`/cloud/tickets/${ticketId}/${stateId}`,
				env,
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
