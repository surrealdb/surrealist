import { Button, Center, Group, Loader, Stack, Text, TextInput } from "@mantine/core";
import { useDebouncedValue, useInputState } from "@mantine/hooks";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { useSidekickChatsQuery, useSidekickMessagesMutation } from "~/hooks/sidekick";
import { useStable } from "~/hooks/stable";
import { useSidekickStore } from "~/stores/sidekick";
import { SidekickChat } from "~/types";
import { iconPlus, iconSearch } from "~/util/icons";
import { groupChatsByDate } from "../helpers";
import { SidekickHistoryEntry } from "./entry";

export interface SidekickHistoryProps {
	onOpenChat: () => void;
}

export function SidekickHistory({ onOpenChat }: SidekickHistoryProps) {
	const { restoreChat, resetChat } = useSidekickStore.getState();
	const [search, setSearch] = useInputState("");

	const [debouncedSearch] = useDebouncedValue(search, 500);

	const activeId = useSidekickStore((state) => state.activeId);
	const chatsQuery = useSidekickChatsQuery(debouncedSearch);
	const messagesMutation = useSidekickMessagesMutation();

	const loadChat = async (chat: SidekickChat) => {
		const history = await messagesMutation.mutateAsync(chat.id);

		onOpenChat();
		restoreChat({
			...chat,
			history,
		});
	};

	const newChat = useStable(() => {
		resetChat();
		onOpenChat();
	});

	const isEmpty = chatsQuery.isSuccess && chatsQuery.data?.length === 0;
	const groupedChats = chatsQuery.isSuccess ? groupChatsByDate(chatsQuery.data) : null;

	const renderChatGroup = (title: string, chats: SidekickChat[]) => {
		if (chats.length === 0) return null;

		return (
			<Stack
				key={title}
				gap="xs"
			>
				<Label mb="xs">{title}</Label>
				{chats.map((chat) => (
					<SidekickHistoryEntry
						key={chat.id.toString()}
						chat={chat}
						isActive={chat.id.equals(activeId)}
						onOpen={loadChat}
					/>
				))}
			</Stack>
		);
	};

	return (
		<Stack gap={36}>
			<Group>
				<TextInput
					flex={1}
					autoFocus
					value={search}
					onChange={setSearch}
					placeholder="Search chats"
					leftSection={<Icon path={iconSearch} />}
				/>
				<Button
					size="sm"
					variant="gradient"
					onClick={newChat}
					rightSection={
						<Icon
							path={iconPlus}
							c="white"
						/>
					}
				>
					New chat
				</Button>
			</Group>
			{chatsQuery.isPending ? (
				<Center>
					<Loader />
				</Center>
			) : isEmpty ? (
				<Center>
					<Text>No chats found</Text>
				</Center>
			) : groupedChats ? (
				<>
					{renderChatGroup("Today", groupedChats.today)}
					{renderChatGroup("Yesterday", groupedChats.yesterday)}
					{renderChatGroup("Past week", groupedChats.pastWeek)}
					{renderChatGroup("Past month", groupedChats.pastMonth)}
					{renderChatGroup("Older", groupedChats.older)}
				</>
			) : (
				<Center>{isEmpty ? <Text>No chats found</Text> : <Loader />}</Center>
			)}
		</Stack>
	);
}
