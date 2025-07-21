import { useQuery } from "@tanstack/react-query";
import { RecordId, surql } from "surrealdb";
import { useContextConnection } from "~/providers/Context";
import { SidekickChat, SidekickChatMessage } from "~/types";

export function useSidekickChats() {
	const [surreal, isAvailable] = useContextConnection();

	return useQuery({
		queryKey: ["sidekick", "conversations"],
		enabled: isAvailable,
		refetchInterval: 30_000,
		queryFn: async () => {
			const [conversations] = await surreal.query<[SidekickChat[]]>(surql`
				SELECT *, count(<-sent_in<-sidekick_message) AS message_count FROM sidekick_chat
			`);

			return conversations;
		},
	});
}

export function useSidekickChatMessages(chatId: RecordId) {
	const [surreal, isAvailable] = useContextConnection();

	return useQuery({
		queryKey: ["sidekick", "conversations", chatId],
		enabled: isAvailable,
		queryFn: async () => {
			const [{ messages }] = await surreal.query<[{ messages: SidekickChatMessage[] }]>(surql`
				SELECT <-sent_in<-sidekick_message AS messages FROM ONLY ${chatId}
			`);

			return messages;
		},
	});
}