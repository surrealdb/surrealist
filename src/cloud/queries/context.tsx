import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useHasCloudSession } from "~/hooks/cloud";
import { useAuthentication } from "~/providers/Auth";
import {
	IntercomConversation,
	IntercomSupportArticle,
	IntercomSupportCollection,
	IntercomSupportCollectionShallow,
	IntercomTicket,
	IntercomTicketTypeAttribute,
} from "~/types";
import { useFeatureFlags } from "~/util/feature-flags";
import { fetchContextAPI } from "../api/context";

/**
 * Fetch a list of all conversations the user has access to
 */
export function useConversationsQuery() {
	const { isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();

	const [flags] = useFeatureFlags();

	return useQuery({
		queryKey: ["cloud", "conversations"],
		refetchInterval: 30_000,
		enabled: isAuthenticated && hasCloudSession && flags.support_tickets,
		queryFn: async () => {
			return fetchContextAPI<IntercomConversation[]>(`/api/support/v1/cloud/conversations`);
		},
	});
}

/**
 * Fetch a list of all tickets for an organization
 */
export function useCloudOrganizationTicketsQuery(organizationId?: string) {
	const [flags] = useFeatureFlags();

	return useQuery({
		queryKey: ["cloud", "organization_tickets", organizationId],
		refetchInterval: 30_000,
		enabled: !!organizationId && flags.support_tickets,
		queryFn: async () => {
			return fetchContextAPI<IntercomTicket[]>(
				`/api/support/v1/cloud/org/${organizationId}/tickets`,
			);
		},
	});
}

/**
 * Get the ticket attributes that should be shown for tickets in a given organization
 */
export function useCloudOrganizationTicketAttributesQuery(organizationId?: string) {
	const [flags] = useFeatureFlags();

	return useQuery({
		queryKey: ["cloud", "organization_ticket_attributes", organizationId],
		enabled: !!organizationId && flags.support_tickets,
		queryFn: async () => {
			return fetchContextAPI<IntercomTicketTypeAttribute[]>(
				`/api/support/v1/cloud/org/${organizationId}/ticket_attributes`,
			);
		},
	});
}

/**
 * Fetch a single conversation
 */
export function useCloudConversationQuery(conversationId?: string) {
	const [flags] = useFeatureFlags();
	const { isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "conversations", conversationId],
		refetchInterval: 30_000,
		enabled: !!conversationId && isAuthenticated && hasCloudSession && flags.support_tickets,
		queryFn: async () => {
			return fetchContextAPI<IntercomConversation>(
				`/api/support/v1/cloud/conversations/${conversationId}`,
			);
		},
	});
}

/**
 * Check if the user has unread messages
 */
export function useCloudUnreadConversationsQuery() {
	const [flags] = useFeatureFlags();
	const { isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "unread_conversations"],
		refetchInterval: 30_000,
		enabled: isAuthenticated && hasCloudSession && flags.support_tickets,
		queryFn: async () => {
			return fetchContextAPI<boolean>(`/api/support/v1/cloud/conversations/has_unread`);
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
			return fetchContextAPI<IntercomSupportCollectionShallow[]>(
				`/api/support/v1/help/collections`,
			);
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
			return fetchContextAPI<IntercomSupportCollection>(
				`/api/support/v1/help/collections/${collectionId}`,
			);
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
			return fetchContextAPI<IntercomSupportArticle>(
				`/api/support/v1/help/articles/${articleId}`,
			);
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
			return fetchContextAPI<IntercomSupportArticle[]>(
				`/api/support/v1/help/articles/search`,
				{
					method: "POST",
					body: JSON.stringify({
						query: query,
					}),
				},
			);
		},
	});
}
