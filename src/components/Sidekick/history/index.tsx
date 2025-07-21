import { Button, Stack } from "@mantine/core";
import { useSidekickChatsQuery, useSidekickMessagesMutation } from "~/hooks/sidekick";
import { useSidekickStore } from "~/stores/sidekick";
import { SidekickChat } from "~/types";

export interface SidekickHistoryProps {
	onRestored: () => void;
}

export function SidekickHistory({ onRestored }: SidekickHistoryProps) {
	const { restoreChat } = useSidekickStore.getState();

	const chatsQuery = useSidekickChatsQuery();
	const messagesMutation = useSidekickMessagesMutation();

	const loadChat = async (chat: SidekickChat) => {
		const history = await messagesMutation.mutateAsync(chat.id);

		console.log("Restoring", {
			...chat,
			history,
		});

		onRestored();
		restoreChat({
			...chat,
			history,
		});
	};

	return (
		<Stack>
			{chatsQuery.data?.map((chat) => (
				<Button
					color="slate"
					key={chat.id.toString()}
					onClick={() => loadChat(chat)}
				>
					{chat.title}
				</Button>
			))}
		</Stack>
	);
}
