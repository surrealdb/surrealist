import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import { CloudTicket } from "~/types";
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
			return fetchTicketsAPI<CloudTicket[]>(`/organisations/${organization}/tickets`);
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
				`/organisations/${organization}/tickets/${ticketId}`,
			);
		},
	});
}
