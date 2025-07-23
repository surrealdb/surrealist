import { Box, Divider, Flex, Group, Image, Stack, Text, Transition } from "@mantine/core";
import { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from "react";
import glowImg from "~/assets/images/glow.webp";
import sidekickImg from "~/assets/images/icons/sidekick.webp";
import { openCloudAuthentication } from "~/cloud/api/auth";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useIsAuthenticated } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { useSidekickStore } from "~/stores/sidekick";
import { iconChat, iconChevronLeft, iconList } from "~/util/icons";
import { ActionButton } from "../ActionButton";
import { SidekickChat } from "./chat";
import { SidekickHistory } from "./history";
import { useSidekickStream } from "./stream";
import classes from "./style.module.scss";

const SidekickChatLazy = memo(SidekickChat);
const SidekickHistoryLazy = memo(SidekickHistory);

export interface SidekickHandle {
	sendMessage: (message: string) => Promise<void>;
	element: HTMLDivElement | null;
}

export const Sidekick = forwardRef<SidekickHandle>((_, ref) => {
	const { applyEvent, startRequest, completeRequest, resetChat } = useSidekickStore.getState();
	const rootRef = useRef<HTMLDivElement>(null);

	const stream = useSidekickStream(applyEvent);
	const activeId = useSidekickStore((state) => state.activeId);
	const activeTitle = useSidekickStore((state) => state.activeTitle);

	const [showHistory, setShowHistory] = useState(false);
	const isAuthed = useIsAuthenticated();

	const toggleHistory = useStable(() => {
		setShowHistory((v) => !v);
	});

	useImperativeHandle(ref, () => ({
		sendMessage: async (message: string) => {
			if (!isAuthed) {
				openCloudAuthentication();
				return;
			}

			resetChat();
			startRequest(message);

			await stream.sendMessage(message);

			completeRequest();
		},
		element: rootRef.current,
	}));

	useEffect(() => {
		return () => {
			if (activeId?.id) {
				stream.cancel();
			}
		};
	}, [activeId?.id, stream.cancel]);

	return (
		<Stack
			ref={rootRef}
			gap={0}
			h="100%"
			w="100%"
		>
			<Group
				p="xl"
				wrap="nowrap"
			>
				<Box pos="relative">
					<Image
						pos="absolute"
						src={glowImg}
						inset={0}
						opacity={0.3}
						style={{ transform: "scale(2)", transition: "opacity 0.3s ease" }}
					/>
					<Image
						pos="relative"
						src={sidekickImg}
						w={52}
						h={52}
					/>
				</Box>
				<Box miw={0}>
					<PrimaryTitle>Sidekick</PrimaryTitle>
					<Text
						fz="lg"
						truncate
					>
						{activeTitle || "New chat"}
					</Text>
				</Box>
				<Spacer />
				{isAuthed && (
					<ActionButton
						label={showHistory ? "Return to chat" : "Show menu"}
						icon={iconChat}
						onClick={toggleHistory}
						size="lg"
					>
						<Icon path={showHistory ? iconChevronLeft : iconList} />
					</ActionButton>
				)}
			</Group>
			<Divider />
			<Box
				flex={1}
				pos="relative"
				style={{ overflow: "hidden" }}
			>
				<Flex
					inset={0}
					flex={1}
					pos="absolute"
					direction="column"
				>
					<SidekickChatLazy
						isAuthed={isAuthed}
						stream={stream}
					/>
				</Flex>
				<Transition
					mounted={showHistory}
					transition="fade-down"
				>
					{(styles) => (
						<Box
							inset={0}
							pos="absolute"
							className={classes.historyPanel}
							style={styles}
							p="xl"
						>
							<SidekickHistoryLazy onOpenChat={toggleHistory} />
						</Box>
					)}
				</Transition>
			</Box>
		</Stack>
	);
});
