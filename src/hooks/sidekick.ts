import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RecordId, surql } from "surrealdb";
import { useContextConnection } from "~/providers/Context";
import { SidekickChat, SidekickChatMessage } from "~/types";

export function useSidekickChatsQuery(search?: string) {
	const [surreal, isAvailable] = useContextConnection();

	return useQuery({
		queryKey: ["sidekick", "chats", { search }],
		enabled: isAvailable,
		refetchInterval: 30_000,
		queryFn: async () => {
			const [conversations] = await surreal.query<[SidekickChat[]]>(surql`
					SELECT *
					FROM sidekick_chat
					WHERE !${search} || title ~ ${search} || <-sent_in<-sidekick_message.content ?= <regex>${search}
					ORDER BY last_activity DESC
				`);

			return conversations;
		},
	});
}

export function useSidekickMessagesMutation() {
	const [surreal] = useContextConnection();

	return useMutation({
		mutationFn: async (chatId: RecordId) => {
			const [messages] = await surreal.query<[SidekickChatMessage[]]>(surql`
				SELECT * FROM ${chatId}<-sent_in<-sidekick_message ORDER BY id ASC;
			`);

			return messages;
		},
	});
}

export function useSidekickRenameMutation() {
	const [surreal] = useContextConnection();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ chatId, newName }: { chatId: RecordId; newName: string }) => {
			await surreal.query(
				surql`UPDATE ${chatId} SET title = ${newName}`,
			);
		},
		onMutate: async ({ chatId, newName }) => {
			await queryClient.cancelQueries({ queryKey: ["sidekick", "chats"] });

			queryClient.setQueriesData<SidekickChat[]>(
				{ queryKey: ["sidekick", "chats"] },
				(old) => {
					return old?.map((chat) =>
						chat.id.equals(chatId) ? { ...chat, title: newName } : chat
					);
				}
			);
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["sidekick", "chats"] });
		},
	});
}

export function useSidekickDeleteMutation() {
	const [surreal] = useContextConnection();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (chatId: RecordId) => {
			await surreal.query(surql`DELETE ${chatId}`);
		},
		onMutate: async (chatId) => {
			await queryClient.cancelQueries({ queryKey: ["sidekick", "chats"] });

			queryClient.setQueriesData<SidekickChat[]>(
				{ queryKey: ["sidekick", "chats"] },
				(old) => old?.filter((chat) => !chat.id.equals(chatId))
			);
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["sidekick", "chats"] });
		},
	});
}