import { useMutation, useQuery } from "@tanstack/react-query";
import { RecordId, surql } from "surrealdb";
import { useContextConnection } from "~/providers/Context";
import { SidekickChat, SidekickChatMessage } from "~/types";

export function useSidekickChatsQuery() {
	const [surreal, isAvailable] = useContextConnection();

	return useQuery({
		queryKey: ["sidekick", "conversations"],
		enabled: isAvailable,
		refetchInterval: 30_000,
		queryFn: async () => {
			const [conversations] = await surreal.query<[SidekickChat[]]>(surql`
				SELECT
					*,
					count(<-sent_in<-sidekick_message) AS message_count
				FROM sidekick_chat
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