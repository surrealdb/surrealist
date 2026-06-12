import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Group,
	Image,
	Paper,
	ScrollArea,
	Stack,
	Text,
	Textarea,
	ThemeIcon,
	Tooltip,
} from "@mantine/core";
import {
	Icon,
	iconAccount,
	iconChat,
	iconDelete,
	iconEye,
	iconMemory,
	iconSearch,
	iconSend,
	iconSpectron,
	MarkdownViewer,
	pictoBrainGradient,
	pictoMemoryGradient,
	pictoSpectronGradient,
	pictoVectorSearchGradient,
} from "@surrealdb/ui";
import { useCallback, useRef, useState } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";
import { ContentPane } from "~/components/Pane";
import { PanelDragger } from "~/components/Pane/dragger";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { usePanelMinSize } from "~/hooks/panels";
import type { ContextViewProps } from "../../types";
import classes from "./style.module.scss";

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

const SUGGESTIONS = [
	"Hi, I'm Alex and I work at SurrealDB.",
	"I prefer TypeScript over JavaScript.",
	"What do you know about me so far?",
];

function formatTime(date: Date): string {
	return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

interface MemoryCardProps {
	memory: MemoryItem;
	isNew?: boolean;
}

function MemoryCard({ memory, isNew }: MemoryCardProps) {
	return (
		<Paper
			p="sm"
			radius="md"
			className={`${classes.memoryCard} ${isNew ? classes.memoryCardNew : ""}`}
		>
			<Group
				justify="space-between"
				align="flex-start"
				gap="xs"
				wrap="nowrap"
			>
				<Text
					fz="sm"
					c="bright"
					className="selectable"
					style={{ flex: 1 }}
				>
					{memory.text}
				</Text>
				{isNew && (
					<Badge
						size="xs"
						variant="light"
						color="violet"
					>
						New
					</Badge>
				)}
			</Group>
			<Text
				fz="xs"
				c="slate"
				mt={4}
			>
				{formatTime(memory.timestamp)}
			</Text>
		</Paper>
	);
}

export default function PlaygroundView(_props: ContextViewProps) {
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

	const sendMessage = useCallback(
		(text: string) => {
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
				const response =
					CANNED_RESPONSES[Math.floor(Math.random() * CANNED_RESPONSES.length)];

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
		},
		[scrollToBottom],
	);

	const handleSend = useCallback(() => {
		const text = input.trim();
		if (!text) return;
		sendMessage(text);
	}, [input, sendMessage]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				handleSend();
			}
		},
		[handleSend],
	);

	const handleClear = useCallback(() => {
		setMessages([]);
		setNewMemories([]);
	}, []);

	return (
		<Stack gap="md">
			{/* HEADER BAND */}
			<Paper
				p="lg"
				radius="lg"
				className={classes.header}
			>
				<Image
					src={pictoSpectronGradient}
					className={classes.headerArt}
					alt=""
					aria-hidden
				/>
				<Group
					justify="space-between"
					align="center"
					wrap="wrap"
					gap="md"
					pos="relative"
					style={{ zIndex: 1 }}
				>
					<Stack gap={4}>
						<Group gap="xs">
							<Badge
								size="sm"
								variant="light"
								color="violet"
								leftSection={
									<Icon
										path={iconSpectron}
										size="xs"
									/>
								}
							>
								Live context
							</Badge>
							<Group
								gap={6}
								align="center"
							>
								<Box
									className={classes.pulseDot}
									aria-hidden
								/>
								<Text
									fz="xs"
									c="slate"
								>
									{messages.length === 0
										? "Ready"
										: `${messages.length} message${messages.length === 1 ? "" : "s"}`}
								</Text>
							</Group>
						</Group>
						<PrimaryTitle fz={26}>Playground</PrimaryTitle>
						<Text
							fz="sm"
							className="selectable"
						>
							Chat with the agent and watch memories form. New memories stream into
							the right panel; retrieved memories show what the agent recalled.
						</Text>
					</Stack>
					<Group gap="xs">
						<Tooltip label="Clear conversation">
							<Button
								variant="subtle"
								color="slate"
								size="sm"
								leftSection={<Icon path={iconDelete} />}
								onClick={handleClear}
								disabled={messages.length === 0 && newMemories.length === 0}
							>
								Clear
							</Button>
						</Tooltip>
					</Group>
				</Group>
			</Paper>

			{/* PANELS */}
			<Box
				style={{ flex: 1, minHeight: 560 }}
				ref={groupRef}
			>
				<PanelGroup direction="horizontal">
					<Panel
						defaultSize={65}
						minSize={minSize}
					>
						<ContentPane
							title="Agent chat"
							icon={iconChat}
							style={{ height: "100%" }}
							infoSection={
								<Badge
									size="xs"
									variant="light"
									color="violet"
									ml="xs"
								>
									Gemini-style demo
								</Badge>
							}
						>
							<Stack
								gap={0}
								h="100%"
								mih={420}
							>
								<ScrollArea
									style={{ flex: 1 }}
									viewportRef={scrollRef}
								>
									<Stack
										gap="md"
										p="sm"
									>
										{messages.length === 0 ? (
											<Stack
												align="center"
												justify="center"
												py={48}
												gap="md"
											>
												<Image
													src={pictoBrainGradient}
													w={96}
													h={96}
													alt=""
													aria-hidden
													style={{ opacity: 0.7 }}
												/>
												<Box
													ta="center"
													maw={420}
												>
													<Text
														fw={600}
														c="bright"
													>
														Start a conversation
													</Text>
													<Text
														fz="sm"
														mt={4}
														className="selectable"
													>
														Say something about yourself - your name, a
														preference, where you are. Watch it appear
														on the right as a new memory.
													</Text>
												</Box>
												<Stack
													gap="xs"
													align="center"
												>
													{SUGGESTIONS.map((s) => (
														<Button
															key={s}
															variant="default"
															size="sm"
															onClick={() => sendMessage(s)}
														>
															{s}
														</Button>
													))}
												</Stack>
											</Stack>
										) : (
											messages.map((msg) =>
												msg.role === "user" ? (
													<Group
														key={msg.id}
														justify="flex-end"
														align="flex-end"
														gap="sm"
														wrap="nowrap"
													>
														<Stack
															gap={2}
															align="flex-end"
															maw="80%"
														>
															<Box className={classes.userBubble}>
																<MarkdownViewer
																	content={msg.content}
																/>
															</Box>
															<Text
																fz="xs"
																c="slate"
															>
																{formatTime(msg.timestamp)}
															</Text>
														</Stack>
														<ThemeIcon
															size={28}
															radius="xl"
															variant="light"
															color="slate"
														>
															<Icon path={iconAccount} />
														</ThemeIcon>
													</Group>
												) : (
													<Group
														key={msg.id}
														align="flex-end"
														gap="sm"
														wrap="nowrap"
													>
														<Box className={classes.assistantBubble}>
															<Icon
																path={iconSpectron}
																c="violet.3"
															/>
														</Box>
														<Stack
															gap={2}
															align="flex-start"
															maw="80%"
														>
															<Box
																className={
																	classes.assistantBubbleContent
																}
															>
																<MarkdownViewer
																	content={msg.content}
																/>
															</Box>
															<Text
																fz="xs"
																c="slate"
															>
																{formatTime(msg.timestamp)}
															</Text>
														</Stack>
													</Group>
												),
											)
										)}
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
										placeholder="Type a message…"
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
										aria-label="Send message"
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
								infoSection={
									newMemories.length > 0 ? (
										<Group
											gap={6}
											align="center"
										>
											<Box
												className={classes.pulseDot}
												aria-hidden
											/>
											<Badge
												variant="light"
												color="violet"
												size="sm"
											>
												{newMemories.length}
											</Badge>
										</Group>
									) : (
										<Badge
											variant="default"
											size="sm"
										>
											0
										</Badge>
									)
								}
								style={{ flex: 1 }}
							>
								<ScrollArea style={{ maxHeight: 240 }}>
									<Stack gap="xs">
										{newMemories.length === 0 ? (
											<Box className={classes.emptyState}>
												<Image
													src={pictoMemoryGradient}
													w={64}
													h={64}
													alt=""
													aria-hidden
													style={{ opacity: 0.55 }}
												/>
												<Text
													fw={600}
													c="bright"
													fz="sm"
												>
													Waiting for input
												</Text>
												<Text
													fz="xs"
													className="selectable"
												>
													Memories extracted from this conversation will
													appear here.
												</Text>
											</Box>
										) : (
											newMemories.map((mem, idx) => (
												<MemoryCard
													key={mem.id}
													memory={mem}
													isNew={idx === 0}
												/>
											))
										)}
									</Stack>
								</ScrollArea>
							</ContentPane>

							<ContentPane
								title="Retrieved memories"
								icon={iconSearch}
								infoSection={
									<Badge
										variant="light"
										color="slate"
										size="sm"
										ml="xs"
										leftSection={
											<Icon
												path={iconEye}
												size="xs"
											/>
										}
									>
										{MOCK_RETRIEVED_MEMORIES.length}
									</Badge>
								}
								style={{ flex: 1 }}
							>
								<ScrollArea style={{ maxHeight: 240 }}>
									<Stack gap="xs">
										{MOCK_RETRIEVED_MEMORIES.length === 0 ? (
											<Box className={classes.emptyState}>
												<Image
													src={pictoVectorSearchGradient}
													w={64}
													h={64}
													alt=""
													aria-hidden
													style={{ opacity: 0.55 }}
												/>
												<Text
													fz="xs"
													className="selectable"
												>
													No memories retrieved for the current query.
												</Text>
											</Box>
										) : (
											MOCK_RETRIEVED_MEMORIES.map((mem) => (
												<MemoryCard
													key={mem.id}
													memory={mem}
												/>
											))
										)}
									</Stack>
								</ScrollArea>
							</ContentPane>
						</Stack>
					</Panel>
				</PanelGroup>
			</Box>
		</Stack>
	);
}
