import {
	Avatar,
	Badge,
	Box,
	Button,
	Center,
	Flex,
	Group,
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
import type { CloudChatMessage } from "~/types";
import { newId } from "~/util/helpers";
import { iconCursor, iconSurreal } from "~/util/icons";

const endpoint = "https://api-prod.scoutos.com/v1/apps/execute";
const appId = "dddef4a4-3fd7-48d1-bbd3-60a0d597e2f2";
const apiKey = import.meta.env.VITE_SCOUT_API_KEY;

type Request = {
	input: string;
	conversation: CloudChatMessage[];
};

export function SupportPage() {
	const { setChatThreadId, pushChatMessage } = useCloudStore.getState();

	const isLight = useIsLight();
	const inputRef = useRef<HTMLInputElement>(null);
	const [input, setInput] = useInputState("");

	const profile = useCloudStore((s) => s.profile);
	const threadId = useCloudStore((s) => s.chatThreadId);
	const conversation = useCloudStore((s) => s.chatConversation);
	const lastResponse = useCloudStore((s) => s.chatLastResponse);

	const { mutateAsync: sendRequest, isPending } = useMutation({
		mutationKey: ["cloud", "support", "message"],
		mutationFn: async (inputs: Request) => {
			const res = await fetch(endpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					id: appId,
					thread_id: threadId,
					inputs,
				}),
			}).then((res) => res.json());

			const output = res?.outputs?.output?.output;
			if (!output) return "Failed to send message";

			adapter.log("Sidekick", `Received response: ${output}`);

			setChatThreadId(res.thread_id);
			return output;
		},
	});

	const sendMessage = useStable(() => {
		pushChatMessage({
			id: newId(),
			content: input,
			sender: "user",
		});

		sendRequest({ input, conversation }).then((res) => {
			pushChatMessage({
				id: newId(),
				content: res,
				sender: "bot",
			});
		});

		setInput("");
		inputRef.current?.focus();
	});

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
							path={iconSurreal}
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
						pb="xl"
					>
						<PrimaryTitle>Sidekick</PrimaryTitle>
						<Text fz="lg">Chat with your personal Surreal assistant</Text>

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
										<Avatar
											radius="md"
											variant="light"
											color="surreal"
											size={40}
										>
											<Icon
												path={iconSurreal}
												noStroke
												c="surreal"
												size="md"
											/>
										</Avatar>
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
										<TypographyStylesProvider
											fz="lg"
											fw={400}
											c="bright"
											// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
											dangerouslySetInnerHTML={{
												__html: marked(message.content),
											}}
										/>
										{message.sender === "bot" &&
											message.id === lastResponse && (
												<Text
													mt="xs"
													fz="xs"
													c="slate"
												>
													This response may be incorrect. Help us improve
													the docs by{" "}
													<Link
														fz="xs"
														href="https://github.com/surrealdb/docs.surrealdb.com"
													>
														clicking here
													</Link>
												</Text>
											)}
									</Paper>
								</Flex>
							))}
							{isPending && (
								<Flex gap="md">
									<Avatar
										radius="md"
										variant="light"
										color="surreal"
										size={40}
									>
										<Icon
											path={iconSurreal}
											noStroke
											c="surreal"
											size="md"
										/>
									</Avatar>
									<Paper
										px="lg"
										py="sm"
										radius="xl"
										maw="80%"
									>
										<Group>
											<Loader
												size={14}
												color="slate.5"
											/>
											<Text
												size="lg"
												c="white"
											>
												Responding...
											</Text>
										</Group>
									</Paper>
								</Flex>
							)}
						</Stack>
					</Box>
				</ScrollArea>
			</Box>
			<Form
				onSubmit={sendMessage}
				maw={950}
				w="100%"
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
					/>
					<Button
						size="lg"
						px="xl"
						type="submit"
						variant="gradient"
						disabled={status === "pending" || !input}
						style={{
							border: "1px solid rgba(255, 255, 255, 0.3)",
							backgroundOrigin: "border-box",
						}}
						rightSection={
							<Icon
								path={iconCursor}
								size="md"
							/>
						}
					>
						Send
					</Button>
				</Group>
			</Form>
			<Text
				mb="md"
				mt="sm"
			>
				You are chatting with an AI assistant, responses may be inaccurate.
			</Text>
		</Stack>
	);
}
