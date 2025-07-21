import {
	Box,
	Button,
	Divider,
	Flex,
	Group,
	Image,
	Paper,
	Stack,
	Text,
	Transition,
} from "@mantine/core";
import { memo, useState } from "react";
import glowImg from "~/assets/images/glow.webp";
import sidekickImg from "~/assets/images/icons/sidekick.webp";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useIsAuthenticated } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { useSidekickStore } from "~/stores/sidekick";
import { iconChat, iconHistory, iconPlus } from "~/util/icons";
import { SidekickChat } from "./chat";
import { SidekickHistory } from "./history";

const SidekickChatLazy = memo(SidekickChat);
const SidekickHistoryLazy = memo(SidekickHistory);

export function Sidekick() {
	const { resetChat } = useSidekickStore.getState();

	const activeTitle = useSidekickStore((state) => state.activeTitle);

	const [showHistory, setShowHistory] = useState(false);
	const isAuthed = useIsAuthenticated();

	const toggleHistory = useStable(() => {
		setShowHistory((v) => !v);
	});

	return (
		<Stack
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
					<>
						<Button
							size="xs"
							color="slate"
							variant="light"
							style={{ flexShrink: 0 }}
							leftSection={<Icon path={showHistory ? iconChat : iconHistory} />}
							onClick={toggleHistory}
						>
							{showHistory ? "Show chat" : "Show history"}
						</Button>
						<Button
							size="xs"
							variant="gradient"
							style={{ flexShrink: 0 }}
							rightSection={<Icon path={iconPlus} />}
							onClick={resetChat}
						>
							New chat
						</Button>
					</>
				)}
			</Group>
			<Divider />
			<Box
				flex={1}
				pos="relative"
				style={{ overflow: "hidden" }}
			>
				<Transition
					mounted={!showHistory}
					transition="fade-up"
				>
					{(styles) => (
						<Flex
							inset={0}
							flex={1}
							pos="absolute"
							direction="column"
							style={styles}
						>
							<SidekickChatLazy isAuthed={isAuthed} />
						</Flex>
					)}
				</Transition>
				<Transition
					mounted={showHistory}
					transition="fade-down"
				>
					{(styles) => (
						<Paper
							inset={0}
							pos="absolute"
							withBorder={false}
							bg="var(--mantine-color-body)"
							style={styles}
							p="xl"
						>
							<SidekickHistoryLazy onRestored={toggleHistory} />
						</Paper>
					)}
				</Transition>
			</Box>
		</Stack>
	);
}
