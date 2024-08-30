import { Button, Flex, Group, Paper, ScrollArea, Stack, Text, TextInput } from "@mantine/core";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { iconCursor } from "~/util/icons";

const endpoint = "https://api-prod.scoutos.com/v1/apps/execute";
const appId = "dddef4a4-3fd7-48d1-bbd3-60a0d597e2f2";
const apiKey = import.meta.env.VITE_SCOUT_API_KEY;

type Message = {
	content: string;
	sender: "user" | "bot";
}

type Request = {
	input: string;
	conversation: Message[];
}

export function SupportPage() {
	const inputRef = useRef<HTMLInputElement>(null);
	const [threadId, setThreadId] = useState<string | undefined>(undefined);
	const [input, setInput] = useState("");
	const [conversation, setConversation] = useState<Message[]>([]);
	const { mutateAsync: sendRequest, isPending, status } = useMutation({
		mutationKey: ["cloud", "support", "message"],
		async mutationFn(inputs: Request) {
			const res = await fetch(endpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					id: appId,
					thread_id: threadId,
					inputs,
				}),
			}).then(res => res.json());

			console.log(res);

			const output = res?.outputs?.output?.output;
			if (!output) return "Failed to send message";
			setThreadId(res.thread_id);
			return output;
		}
	});

	const sendMessage = useStable(() => {
		setConversation((c) => [
			...c,
			{
				content: input,
				sender: "user",
			},
		]);

		sendRequest({ input, conversation }).then((res) => {
			setConversation((c) => [
				...c,
				{
					content: res,
					sender: "bot",
				},
			]);
		});

		setInput("");
		inputRef.current?.focus();
	});

	return (
		<Stack
			gap="xl"
			h="100%"
		>
			<Stack
				flex={1}
				pos="relative"
			>
				<ScrollArea pos="absolute" inset={0}>
					{conversation.map((message, i) => (
						<Flex
							justify={message.sender === "user" ? "end" : "start"}
							key={i}
						>
							<Paper
								px="lg"
								py="sm"
								radius="xl"
								bg={message.sender === "user" ? "slate" : "blue"}
								maw="80%"
							>
								<Text size="lg" c="white">
									{message.content}
								</Text>
							</Paper>
						</Flex>
					))}
					{status == "pending" && (
						<Flex>
							<Paper
								px="lg"
								py="sm"
								radius="xl"
								bg="blue"
								maw="80%"
							>
								<Text size="lg" c="white">
									Typing...
								</Text>
							</Paper>
						</Flex>
					)}
				</ScrollArea>
			</Stack>
			<Stack pb={2}>
				<Form onSubmit={sendMessage}>
					<Group>
						<TextInput
							ref={inputRef}
							size="lg"
							style={{
								flexGrow: 1
							}}
							placeholder="How can we help you today?"
							value={input}
							onChange={(e) => setInput(e.target.value)}
						/>
						<Button
							size="lg"
							px="xl"
							rightSection={
								<Icon
									path={iconCursor}
									size="md"
								/>
							}
							type="submit"
							disabled={status == 'pending'}
						>
							Send
						</Button>
					</Group>
				</Form>
				<Text opacity={40}>
					You are currently chatting with a bot. To send your message to a human, simply ask.
				</Text>
			</Stack>
		</Stack>
	);
}
