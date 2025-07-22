import { Button, Center, Group, Loader, Stack, Text, TextInput } from "@mantine/core";
import { useDebouncedValue, useInputState } from "@mantine/hooks";
import { Entry } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { RelativeTime } from "~/components/RelativeTime";
import { useSidekickChatsQuery, useSidekickMessagesMutation } from "~/hooks/sidekick";
import { useStable } from "~/hooks/stable";
import { useSidekickStore } from "~/stores/sidekick";
import { SidekickChat } from "~/types";
import { iconChevronRight, iconPlus, iconSearch } from "~/util/icons";

export interface SidekickHistoryProps {
	onOpenChat: () => void;
}

interface GroupedChats {
	today: SidekickChat[];
	yesterday: SidekickChat[];
	pastWeek: SidekickChat[];
	pastMonth: SidekickChat[];
	older: SidekickChat[];
}

function groupChatsByDate(chats: SidekickChat[]): GroupedChats {
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
	const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
	const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

	const grouped: GroupedChats = {
		today: [],
		yesterday: [],
		pastWeek: [],
		pastMonth: [],
		older: [],
	};

	chats.forEach((chat) => {
		const chatDate = new Date(chat.last_activity);
		const chatDay = new Date(chatDate.getFullYear(), chatDate.getMonth(), chatDate.getDate());

		if (chatDay.getTime() === today.getTime()) {
			grouped.today.push(chat);
		} else if (chatDay.getTime() === yesterday.getTime()) {
			grouped.yesterday.push(chat);
		} else if (chatDay >= weekAgo) {
			grouped.pastWeek.push(chat);
		} else if (chatDay >= monthAgo) {
			grouped.pastMonth.push(chat);
		} else {
			grouped.older.push(chat);
		}
	});

	return grouped;
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

	const groupedChats = chatsQuery.data ? groupChatsByDate(chatsQuery.data) : null;

	const renderChatGroup = (title: string, chats: SidekickChat[]) => {
		if (chats.length === 0) return null;

		return (
			<Stack
				key={title}
				gap={2}
			>
				<Label
					ml={8}
					c="surreal"
					mb="xs"
				>
					{title}
				</Label>
				{chats.map((chat) => (
					<Entry
						h={32}
						color="slate"
						key={chat.id.toString()}
						onClick={() => loadChat(chat)}
						variant={chat.id.equals(activeId) ? "light" : "subtle"}
						justify="start"
						rightSection={
							<>
								<Text mr="md">
									<RelativeTime value={chat.last_activity.valueOf()} />
								</Text>
								<Icon path={iconChevronRight} />
							</>
						}
					>
						<Text
							style={{
								textOverflow: "ellipsis",
								overflow: "hidden",
							}}
						>
							{chat.title}
						</Text>
					</Entry>
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
			{groupedChats ? (
				<>
					{renderChatGroup("Today", groupedChats.today)}
					{renderChatGroup("Yesterday", groupedChats.yesterday)}
					{renderChatGroup("Past week", groupedChats.pastWeek)}
					{renderChatGroup("Past month", groupedChats.pastMonth)}
					{renderChatGroup("Older", groupedChats.older)}
				</>
			) : (
				<Center>
					<Loader />
				</Center>
			)}
		</Stack>
	);
}
