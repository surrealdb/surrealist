import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import {
	IntercomConversation,
	IntercomSupportArticle,
	IntercomSupportCollection,
	IntercomSupportCollectionShallow,
	IntercomTicketType,
} from "~/types";
import { useFeatureFlags } from "~/util/feature-flags";
import { fetchContextAPI } from "../api/context";

/**
 * Fetch a list of all conversations the user has access to
 */
export function useConversationsQuery() {
	const authState = useCloudStore((state) => state.authState);
	const [{ support_tickets: supportTicketsEnabled }] = useFeatureFlags();

	return useQuery({
		queryKey: ["cloud", "conversations"],
		enabled: authState === "authenticated" && supportTicketsEnabled,
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
	const [{ support_tickets: supportTicketsEnabled }] = useFeatureFlags();

	return useQuery({
		queryKey: ["cloud", "ticket_types"],
		enabled: authState === "authenticated" && supportTicketsEnabled,
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
	const [{ support_tickets: supportTicketsEnabled }] = useFeatureFlags();

	return useQuery({
		queryKey: ["cloud", "conversations", conversationId],
		enabled: !!conversationId && authState === "authenticated" && supportTicketsEnabled,
		queryFn: async () => {
			return fetchContextAPI<IntercomConversation>(`/cloud/conversations/${conversationId}`);
		},
	});
}

/**
 * Check if the user has unread messages
 */
export function useCloudUnreadConversationsQuery() {
	const authState = useCloudStore((state) => state.authState);
	const [{ support_tickets: supportTicketsEnabled }] = useFeatureFlags();

	return useQuery({
		queryKey: ["cloud", "unread_conversations"],
		enabled: authState === "authenticated" && supportTicketsEnabled,
		queryFn: async () => {
			return fetchContextAPI<boolean>(`/cloud/conversations/has_unread`);
		},
	});
}

/**
 * Get all help collections
 */
export function useSupportCollectionsQuery() {
	return useQuery({
		queryKey: ["cloud", "support_categories"],
		queryFn: async () => {
			return fetchContextAPI<IntercomSupportCollectionShallow[]>(`/help/collections`);
		},
	});
}

/**
 * Get a single help collection
 */
export function useSupportCollectionQuery(collectionId?: string) {
	return useQuery({
		queryKey: ["cloud", "support_collections", collectionId],
		enabled: !!collectionId,
		queryFn: async () => {
			return fetchContextAPI<IntercomSupportCollection>(`/help/collections/${collectionId}`);
		},
	});
}

/**
 * Get a single support article
 */
export function useSupportArticleQuery(articleId?: string) {
	return useQuery({
		queryKey: ["cloud", "support_articles", articleId],
		enabled: !!articleId,
		queryFn: async () => {
			return fetchContextAPI<IntercomSupportArticle>(`/help/articles/${articleId}`);
		},
	});
}

/**
 * Search help articles
 */
export function useSearchHelpArticlesQuery(query: string) {
	return useQuery({
		queryKey: ["cloud", "support_search", query],
		enabled: !!query && query.length > 0,
		placeholderData: keepPreviousData,
		queryFn: async () => {
			return fetchContextAPI<IntercomSupportArticle[]>(`/help/articles/search`, {
				method: "POST",
				body: JSON.stringify({
					query: query,
				}),
			});
		},
	});
}
