import {
	ActionIcon,
	Badge,
	Box,
	Center,
	Group,
	ScrollArea,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";

import { useInputState } from "@mantine/hooks";
import { memo, useEffect, useRef } from "react";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useCloudStore } from "~/stores/cloud";
import { newId } from "~/util/helpers";
import { iconCursor, iconSidekick } from "~/util/icons";
import { useCopilotMutation } from "./copilot";
import { ChatMessage } from "./message";

const ChatMessageLazy = memo(ChatMessage);

export function SupportPage() {
	const { pushChatMessage } = useCloudStore.getState();

	const isLight = useIsLight();
	const inputRef = useRef<HTMLInputElement>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const [input, setInput] = useInputState("");

	const profile = useCloudStore((s) => s.profile);
	const conversation = useCloudStore((s) => s.chatConversation);
	const lastResponse = useCloudStore((s) => s.chatLastResponse);

	const { sendMessage, isResponding } = useCopilotMutation();

	const submitMessage = useStable(() => {
		pushChatMessage({
			id: newId(),
			content: input,
			sender: "user",
			loading: false,
		});

		inputRef.current?.focus();
		sendMessage(input);
		setInput("");
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (scrollRef.current) {
			const { scrollHeight, clientHeight, scrollTop } = scrollRef.current;

			if (scrollHeight - clientHeight - scrollTop < 50) {
				scrollRef.current?.scrollTo({
					top: scrollHeight,
					behavior: "smooth",
				});
			}
		}
	}, [conversation]);

	const canSend = input && !isResponding;

	return (
		<Stack
			gap={0}
			h="100%"
			w="100%"
			align="center"
		>
			<Box
				flex={1}
				w="100%"
				pos="relative"
			>
				{conversation.length === 0 && (
					<Center
						pos="absolute"
						inset={0}
					>
						<Icon
							path={iconSidekick}
							size={10}
							noStroke
							color="slate.8"
						/>
					</Center>
				)}
				<ScrollArea
					pos="absolute"
					viewportRef={scrollRef}
					inset={0}
				>
					<Box
						mx="auto"
						maw={900}
						pb={96}
					>
						<PrimaryTitle>Sidekick</PrimaryTitle>
						<Text fz="lg">
							Chat with Sidekick, your personal Surreal assistant designed to answer
							your database questions.
						</Text>

						<Badge
							mt="sm"
							color="orange"
							variant="light"
							tt="unset"
							fw="unset"
							lts="unset"
						>
							Sidekick is still in beta, responses may be inaccurate.
						</Badge>
						<Stack
							mt={42}
							gap={42}
						>
							{conversation.map((message, i) => (
								<ChatMessageLazy
									message={message}
									profile={profile}
									lastResponse={lastResponse}
									isResponding={isResponding}
									isLight={isLight}
									key={i}
								/>
							))}
						</Stack>
					</Box>
				</ScrollArea>
			</Box>
			<Form
				onSubmit={submitMessage}
				maw={900}
				w="100%"
				style={{
					transform: "translateY(-24px)",
				}}
			>
				<Group>
					<TextInput
						ref={inputRef}
						size="lg"
						style={{
							flexGrow: 1,
						}}
						placeholder="Send a message..."
						value={input}
						autoFocus
						onChange={setInput}
						rightSection={
							<ActionIcon
								size="lg"
								type="submit"
								variant="gradient"
								disabled={!canSend}
								style={{
									opacity: canSend ? 1 : 0.5,
									border: "1px solid rgba(255, 255, 255, 0.3)",
									backgroundOrigin: "border-box",
									filter: canSend ? undefined : "saturate(0%)",
									transition: "all 0.1s",
								}}
							>
								<Icon
									path={iconCursor}
									c="white"
								/>
							</ActionIcon>
						}
					/>
				</Group>
			</Form>
			<Text mb="md">You are chatting with an AI assistant, responses may be inaccurate.</Text>
		</Stack>
	);
}
