import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import { CloudTicket, CloudTicketType } from "~/types";
import { fetchTicketsAPI } from "../api/tickets";

/**
 * Fetch organization tickets list
 */
export function useCloudTicketsQuery(organization?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "tickets", organization],
		enabled: !!organization && authState === "authenticated",
		queryFn: async () => {
			return fetchTicketsAPI<CloudTicket[]>(`/cloud/organisations/${organization}/tickets`);
		},
	});
}

/**
 * Fetch organization tickets list
 */
export function useCloudTicketTypesQuery(organization?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "ticket_types", organization],
		enabled: !!organization && authState === "authenticated",
		queryFn: async () => {
			return fetchTicketsAPI<CloudTicketType[]>(
				`/cloud/organisations/${organization}/ticket_types`,
			);
		},
	});
}

/**
 * Fetch a single ticket for an organization
 */
export function useCloudTicketQuery(organization?: string, ticketId?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "tickets", organization, ticketId],
		enabled: !!organization && !!ticketId && authState === "authenticated",
		queryFn: async () => {
			return fetchTicketsAPI<CloudTicket>(
				`/cloud/organisations/${organization}/tickets/${ticketId}`,
			);
		},
	});
}
