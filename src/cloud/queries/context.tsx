import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import { IntercomConversation, IntercomTicketType } from "~/types";
import { fetchContextAPI } from "../api/context";

/**
 * Fetch a list of all conversations the user has access to
 */
export function useConversationsQuery() {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "conversations"],
		enabled: authState === "authenticated",
		queryFn: async () => {
			return fetchContextAPI<IntercomConversation[]>(`/cloud/conversations`);
		},
	});
}

/**
 * Fetch the ticket types that the user has access to
 */
export function useCloudTicketTypesQuery() {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "ticket_types"],
		enabled: authState === "authenticated",
		queryFn: async () => {
			return fetchContextAPI<IntercomTicketType[]>(`/cloud/tickets/types`);
		},
	});
}

/**
 * Fetch a single conversation
 */
export function useCloudConversationQuery(conversationId?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "conversations", conversationId],
		enabled: !!conversationId && authState === "authenticated",
		queryFn: async () => {
			return fetchContextAPI<IntercomConversation>(`/cloud/conversations/${conversationId}`);
		},
	});
}
