import {
	ActionIcon,
	Avatar,
	Badge,
	Box,
	Center,
	Flex,
	Group,
	Image,
	Loader,
	Paper,
	ScrollArea,
	Stack,
	Text,
	TextInput,
	TypographyStylesProvider,
} from "@mantine/core";

import { useInputState } from "@mantine/hooks";
import { useMutation } from "@tanstack/react-query";
import { marked } from "marked";
import { useRef } from "react";
import { adapter } from "~/adapter";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { Link } from "~/components/Link";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useCloudStore } from "~/stores/cloud";
import { newId } from "~/util/helpers";
import { iconCursor, iconSidekick } from "~/util/icons";

import sidekickImg from "~/assets/images/sidekick.webp";
import { useCopilotMutation } from "./copilot";

export function SupportPage() {
	const { setChatThreadId, pushChatMessage } = useCloudStore.getState();

	const isLight = useIsLight();
	const inputRef = useRef<HTMLInputElement>(null);
	const [input, setInput] = useInputState("");

	const profile = useCloudStore((s) => s.profile);
	const threadId = useCloudStore((s) => s.chatThreadId);
	const conversation = useCloudStore((s) => s.chatConversation);
	const lastResponse = useCloudStore((s) => s.chatLastResponse);

	const { sendMessage, isResponding, isLoading } = useCopilotMutation();

	const submitMessage = useStable(() => {
		pushChatMessage({
			id: newId(),
			content: input,
			sender: "user",
		});

		inputRef.current?.focus();
		sendMessage(input);
		setInput("");
	});

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
					inset={0}
				>
					<Box
						mx="auto"
						maw={900}
						pb={64}
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
								<Flex
									justify={message.sender === "user" ? "end" : "start"}
									direction={message.sender === "user" ? "row-reverse" : "row"}
									gap="md"
									key={i}
								>
									{message.sender === "bot" ? (
										<SidekickAvatar />
									) : (
										<Avatar
											radius="md"
											size={40}
											name={profile.name}
											src={profile.picture}
										/>
									)}
									<Paper
										px="lg"
										py="sm"
										maw="80%"
										bg={
											message.sender === "user"
												? isLight
													? "slate.1"
													: "slate.6"
												: isLight
													? "white"
													: "slate.8"
										}
									>
										{message.id === lastResponse && isLoading ? (
											<Group>
												<Loader
													size={14}
													color="slate.5"
												/>
												<Text
													size="lg"
													c="white"
												>
													Thinking...
												</Text>
											</Group>
										) : (
											<>
												<TypographyStylesProvider
													fz="lg"
													fw={400}
													c="bright"
													// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
													dangerouslySetInnerHTML={{
														__html: marked(message.content),
													}}
												/>
												{message.id === lastResponse && !isResponding && (
													<Text
														mt="md"
														fz="xs"
														c="slate"
													>
														This response may be incorrect. Help us
														improve the docs by{" "}
														<Link
															fz="xs"
															href="https://github.com/surrealdb/docs.surrealdb.com"
														>
															clicking here
														</Link>
													</Text>
												)}
											</>
										)}
									</Paper>
								</Flex>
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

function SidekickAvatar() {
	return (
		<Avatar
			radius="md"
			variant="light"
			color="surreal"
			size={40}
		>
			<Image
				src={sidekickImg}
				w={28}
				h={28}
			/>
		</Avatar>
	);
}
