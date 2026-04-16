import {
	ActionIcon,
	Badge,
	Box,
	Group,
	Paper,
	ScrollArea,
	Stack,
	Text,
	Textarea,
} from "@mantine/core";
import { Icon, iconMemory, iconSend, Markdown } from "@surrealdb/ui";
import { useCallback, useRef, useState } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";
import { ContentPane } from "~/components/Pane";
import { PanelDragger } from "~/components/Pane/dragger";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { usePanelMinSize } from "~/hooks/panels";
import { useIsLight } from "~/hooks/theme";
import type { ContextViewProps } from "../../types";

interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
}

interface MemoryItem {
	id: string;
	text: string;
	timestamp: Date;
}

const MOCK_RETRIEVED_MEMORIES: MemoryItem[] = [
	{
		id: "rm-1",
		text: "User's name is Alex",
		timestamp: new Date("2026-04-08T09:00:00Z"),
	},
	{
		id: "rm-2",
		text: "Prefers dark mode in all applications",
		timestamp: new Date("2026-04-07T14:30:00Z"),
	},
	{
		id: "rm-3",
		text: "Located in London, United Kingdom",
		timestamp: new Date("2026-04-06T11:00:00Z"),
	},
	{
		id: "rm-4",
		text: "Uses Mantine v8 as preferred UI framework",
		timestamp: new Date("2026-04-05T16:20:00Z"),
	},
];

const CANNED_RESPONSES = [
	"I've noted that information. Based on what I know about you, I can help tailor my responses accordingly.",
	"Thanks for sharing! I've stored this as a new memory for future reference.",
	"Got it. I'll keep that in mind for our future conversations.",
	"Interesting! I've added this to your context so I can provide more personalised responses.",
];

function formatTime(date: Date): string {
	return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function MemoryCard({ memory }: { memory: MemoryItem }) {
	return (
		<Paper
			p="xs"
			withBorder
		>
			<Text
				fz="sm"
				c="bright"
			>
				{memory.text}
			</Text>
			<Text
				fz="xs"
				mt={4}
			>
				{formatTime(memory.timestamp)}
			</Text>
		</Paper>
	);
}

export default function PlaygroundView(_props: ContextViewProps) {
	const isLight = useIsLight();
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [newMemories, setNewMemories] = useState<MemoryItem[]>([]);
	const [input, setInput] = useState("");
	const scrollRef = useRef<HTMLDivElement>(null);
	const [minSize, groupRef] = usePanelMinSize(300);

	const scrollToBottom = useCallback(() => {
		requestAnimationFrame(() => {
			scrollRef.current?.scrollTo({
				top: scrollRef.current.scrollHeight,
				behavior: "smooth",
			});
		});
	}, []);

	const handleSend = useCallback(() => {
		const text = input.trim();
		if (!text) return;

		const userMessage: ChatMessage = {
			id: crypto.randomUUID(),
			role: "user",
			content: text,
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		scrollToBottom();

		const newMem: MemoryItem = {
			id: crypto.randomUUID(),
			text: text.length > 60 ? `${text.slice(0, 60)}...` : text,
			timestamp: new Date(),
		};

		setTimeout(() => {
			const response = CANNED_RESPONSES[Math.floor(Math.random() * CANNED_RESPONSES.length)];

			const assistantMessage: ChatMessage = {
				id: crypto.randomUUID(),
				role: "assistant",
				content: response,
				timestamp: new Date(),
			};

			setMessages((prev) => [...prev, assistantMessage]);
			setNewMemories((prev) => [newMem, ...prev]);
			scrollToBottom();
		}, 800);
	}, [input, scrollToBottom]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				handleSend();
			}
		},
		[handleSend],
	);

	return (
		<>
			<PrimaryTitle fz={32}>Playground</PrimaryTitle>

			<Box
				style={{ flex: 1, minHeight: 500 }}
				ref={groupRef}
			>
				<PanelGroup direction="horizontal">
					<Panel
						defaultSize={65}
						minSize={minSize}
					>
						<ContentPane
							title="Agent chat"
							icon={iconMemory}
							style={{ height: "100%" }}
						>
							<Stack
								gap={0}
								h="100%"
								mih={400}
							>
								<ScrollArea
									style={{ flex: 1 }}
									viewportRef={scrollRef}
								>
									<Stack
										gap="md"
										p="sm"
									>
										{messages.length === 0 && (
											<Text
												ta="center"
												py={60}
											>
												Send a message to start the conversation
											</Text>
										)}
										{messages.map((msg) => (
											<Box key={msg.id}>
												{msg.role === "user" ? (
													<Box ml="xl">
														<Paper
															p="sm"
															bg={
																isLight
																	? "obsidian.1"
																	: "obsidian.6"
															}
														>
															<Markdown content={msg.content} />
														</Paper>
														<Text
															fz="xs"
															ta="right"
															mt={2}
														>
															{formatTime(msg.timestamp)}
														</Text>
													</Box>
												) : (
													<Box mr="xl">
														<Markdown content={msg.content} />
														<Text
															fz="xs"
															mt={2}
														>
															{formatTime(msg.timestamp)}
														</Text>
													</Box>
												)}
											</Box>
										))}
									</Stack>
								</ScrollArea>
								<Group
									gap="sm"
									p="sm"
									pt="md"
									wrap="nowrap"
									align="flex-end"
								>
									<Textarea
										placeholder="Type a message..."
										value={input}
										onChange={(e) => setInput(e.currentTarget.value)}
										onKeyDown={handleKeyDown}
										autosize
										minRows={1}
										maxRows={4}
										style={{ flex: 1 }}
									/>
									<ActionIcon
										size="lg"
										variant="gradient"
										onClick={handleSend}
										disabled={!input.trim()}
									>
										<Icon path={iconSend} />
									</ActionIcon>
								</Group>
							</Stack>
						</ContentPane>
					</Panel>

					<PanelDragger />

					<Panel
						defaultSize={35}
						minSize={minSize}
					>
						<Stack
							gap="sm"
							h="100%"
						>
							<ContentPane
								title="New memories"
								icon={iconMemory}
								rightSection={
									<Badge
										variant="light"
										size="sm"
									>
										{newMemories.length}
									</Badge>
								}
								style={{ flex: 1 }}
							>
								<ScrollArea style={{ maxHeight: 200 }}>
									<Stack gap="xs">
										{newMemories.length === 0 ? (
											<Text
												fz="sm"
												ta="center"
												py="md"
											>
												Memories from this conversation will appear here
											</Text>
										) : (
											newMemories.map((mem) => (
												<MemoryCard
													key={mem.id}
													memory={mem}
												/>
											))
										)}
									</Stack>
								</ScrollArea>
							</ContentPane>

							<ContentPane
								title="Retrieved memories"
								icon={iconMemory}
								rightSection={
									<Badge
										variant="light"
										size="sm"
									>
										{MOCK_RETRIEVED_MEMORIES.length}
									</Badge>
								}
								style={{ flex: 1 }}
							>
								<ScrollArea style={{ maxHeight: 200 }}>
									<Stack gap="xs">
										{MOCK_RETRIEVED_MEMORIES.map((mem) => (
											<MemoryCard
												key={mem.id}
												memory={mem}
											/>
										))}
									</Stack>
								</ScrollArea>
							</ContentPane>
						</Stack>
					</Panel>
				</PanelGroup>
			</Box>
		</>
	);
}
