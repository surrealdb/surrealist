import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiBase } from "~/cloud/api/endpoints";
import { getAccessToken, useAuthentication } from "~/providers/Auth";
import type { SidekickChat, SidekickChatMessage } from "~/types";
import { showErrorNotification } from "~/util/helpers";

async function sidekickFetch<T>(path: string, options?: RequestInit): Promise<T> {
	const accessToken = await getAccessToken();
	const response = await fetch(`${getApiBase()}/sidekick/v1${path}`, {
		...options,
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
			...options?.headers,
		},
	});

	if (!response.ok) {
		throw new Error(`Sidekick API error: ${response.status}`);
	}

	const json = await response.json();
	return json.data as T;
}

function extractKey(id: unknown): string {
	if (typeof id !== "string") return String(id);
	const idx = id.indexOf(":");
	return idx >= 0 ? id.slice(idx + 1) : id;
}

function parseChat(raw: Record<string, unknown>): SidekickChat {
	return {
		id: extractKey(raw.id),
		author: raw.author as string,
		title: raw.title as string,
		last_activity: new Date(raw.last_activity as string),
	};
}

function parseMessage(raw: Record<string, unknown>): SidekickChatMessage {
	return {
		id: raw.id ? extractKey(raw.id) : null,
		content: raw.content as string,
		role: raw.role as "user" | "assistant",
		sent_at: new Date(raw.sent_at as string),
		sources: raw.sources as SidekickChatMessage["sources"],
	};
}

export function useSidekickChatsQuery(search?: string) {
	const { isAuthenticated } = useAuthentication();

	return useQuery({
		queryKey: ["sidekick", "chats", { search }],
		enabled: isAuthenticated,
		refetchInterval: 30_000,
		queryFn: async () => {
			try {
				const params = new URLSearchParams();
				if (search) params.set("search", search);

				const suffix = params.size > 0 ? `?${params}` : "";
				const chats = await sidekickFetch<Record<string, unknown>[]>(`/chats${suffix}`);
				return chats.map(parseChat);
			} catch (error) {
				showErrorNotification({
					title: "Failed to fetch chat history",
					content: error,
				});

				console.error(error);
				return [];
			}
		},
	});
}

export function useSidekickMessagesMutation() {
	return useMutation({
		mutationFn: async (chatId: string) => {
			try {
				const messages = await sidekickFetch<Record<string, unknown>[]>(
					`/chats/${encodeURIComponent(chatId)}/messages`,
				);
				return messages.map(parseMessage);
			} catch (error) {
				showErrorNotification({
					title: "Failed to fetch chat messages",
					content: error,
				});

				console.error(error);
				return [];
			}
		},
	});
}

export function useSidekickRenameMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ chatId, newName }: { chatId: string; newName: string }) => {
			await sidekickFetch(`/chats/${encodeURIComponent(chatId)}`, {
				method: "PATCH",
				body: JSON.stringify({ title: newName }),
			});
		},
		onMutate: async ({ chatId, newName }) => {
			await queryClient.cancelQueries({ queryKey: ["sidekick", "chats"] });

			queryClient.setQueriesData<SidekickChat[]>(
				{ queryKey: ["sidekick", "chats"] },
				(old) => {
					return old?.map((chat) =>
						chat.id === chatId ? { ...chat, title: newName } : chat,
					);
				},
			);
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["sidekick", "chats"] });
		},
	});
}

export function useSidekickDeleteMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (chatId: string) => {
			try {
				await sidekickFetch(`/chats/${encodeURIComponent(chatId)}`, {
					method: "DELETE",
				});
			} catch (error) {
				showErrorNotification({
					title: "Failed to delete chat",
					content: error,
				});

				console.error(error);
			}
		},
		onMutate: async (chatId) => {
			await queryClient.cancelQueries({ queryKey: ["sidekick", "chats"] });

			queryClient.setQueriesData<SidekickChat[]>({ queryKey: ["sidekick", "chats"] }, (old) =>
				old?.filter((chat) => chat.id !== chatId),
			);
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["sidekick", "chats"] });
		},
	});
}
