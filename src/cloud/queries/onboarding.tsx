import { useQuery } from "@tanstack/react-query";
import { useHasCloudSession, useIsAuthenticated } from "~/hooks/cloud";
import { fetchAPI } from "../api";

export interface Condition {
	name: string;
	url: string;
}

export type Question =
	| {
			data: { min_length?: number; max_length?: number };
			id: number;
			question: string;
			type: "text";
	  }
	| {
			data: { options: { order: number; text: string; value: string }[] };
			id: number;
			question: string;
			type: "option";
	  };

/**
 * Fetch Terms & Conditions and
 */
export function useCloudTCPPQuery() {
	const isAuthenticated = useIsAuthenticated();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "tc-pp"],
		enabled: isAuthenticated && hasCloudSession,
		queryFn: async () => {
			return fetchAPI<Condition[]>(`/tc-pp`);
		},
	});
}

/**
 * Fetch user form questions
 */
export function useCloudFormQuery() {
	const isAuthenticated = useIsAuthenticated();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "form"],
		enabled: isAuthenticated && hasCloudSession,
		queryFn: async () => {
			return fetchAPI<Question[]>(`/user/form`);
		},
	});
}
