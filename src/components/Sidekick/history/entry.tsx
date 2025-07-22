import { Text } from "@mantine/core";
import { useContextMenu } from "mantine-contextmenu";
import { useState } from "react";
import { EditableText } from "~/components/EditableText";
import { Entry } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { RelativeTime } from "~/components/RelativeTime";
import { useSidekickDeleteMutation, useSidekickRenameMutation } from "~/hooks/sidekick";
import { useStable } from "~/hooks/stable";
import { useSidekickStore } from "~/stores/sidekick";
import { SidekickChat } from "~/types";
import { iconArrowUpRight, iconChevronRight, iconDelete, iconText } from "~/util/icons";

export interface SidekickHistoryEntryProps {
	chat: SidekickChat;
	isActive: boolean;
	onOpen: (chat: SidekickChat) => void;
}

export function SidekickHistoryEntry({ chat, isActive, onOpen }: SidekickHistoryEntryProps) {
	const { resetChat } = useSidekickStore.getState();
	const { showContextMenu } = useContextMenu();
	const [isRenaming, setIsRenaming] = useState(false);
	const renameMutation = useSidekickRenameMutation();
	const deleteMutation = useSidekickDeleteMutation();

	const renameChat = useStable((newName: string) => {
		renameMutation.mutate({ chatId: chat.id, newName });
	});

	const deleteChat = useStable(() => {
		deleteMutation.mutate(chat.id);

		if (isActive) {
			resetChat();
		}
	});

	const handleOpen = useStable(() => {
		onOpen(chat);
	});

	const buildContextMenu = showContextMenu([
		{
			key: "open",
			title: "Open",
			icon: <Icon path={iconArrowUpRight} />,
			onClick: handleOpen,
		},
		{
			key: "rename",
			title: "Rename",
			icon: <Icon path={iconText} />,
			onClick: () => setIsRenaming(true),
		},
		{
			key: "divider-1",
		},
		{
			key: "remove",
			title: "Delete",
			color: "pink.7",
			icon: <Icon path={iconDelete} />,
			onClick: deleteChat,
		},
	]);

	return (
		<Entry
			h={32}
			color="slate"
			key={chat.id.toString()}
			onClick={isRenaming ? undefined : handleOpen}
			variant={isActive ? "light" : "subtle"}
			justify="start"
			rightSection={
				<>
					<Text mr="md">
						<RelativeTime value={chat.last_activity.valueOf()} />
					</Text>
					<Icon path={iconChevronRight} />
				</>
			}
			onContextMenu={buildContextMenu}
		>
			<EditableText
				value={chat.title || "New chat"}
				onChange={renameChat}
				activationMode="none"
				editable={isRenaming}
				onEditableChange={setIsRenaming}
				withDecoration
				style={{
					outline: "none",
					textOverflow: "ellipsis",
					overflow: "hidden",
				}}
			/>
		</Entry>
	);
}
