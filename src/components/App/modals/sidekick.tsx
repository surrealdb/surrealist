import sidekickImg from "~/assets/images/icons/sidekick.webp";
import glowImg from "~/assets/images/glow.webp";
import classes from "../style.module.scss";

import {
	Box,
	Button,
	Group,
	Stack,
	Text,
	Textarea,
	ScrollArea,
	ActionIcon,
	Center,
	Image,
	Paper,
	ThemeIcon,
	Transition,
	Flex,
} from "@mantine/core";

import {
	iconCursor,
	iconReset,
	iconHistory,
	iconTable,
	iconRelation,
	iconAccount,
	iconChevronRight,
	iconCreditCard,
	iconDownload,
	iconLive,
	iconOpen,
	iconPlus,
	iconQuery,
	iconStar,
	iconTransfer,
	iconChat,
} from "~/util/icons";

import { Divider, Drawer } from "@mantine/core";
import { useInputState, useDisclosure } from "@mantine/hooks";
import { useRef, useMemo, useEffect, useState } from "react";
import { DrawerResizer } from "~/components/DrawerResizer";
import { useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useCloudProfile, useIsAuthenticated } from "~/hooks/cloud";
import { useCloudStore } from "~/stores/cloud";
import { useCopilotMutation } from "../../Sidekick/copilot";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { ChatMessage } from "../../Sidekick/message";
import { shuffle } from "radash";
import { adapter } from "~/adapter";
import { openCloudAuthentication } from "~/cloud/api/auth";
import { Spacer } from "~/components/Spacer";
import { useSidekickConversations } from "~/hooks/sidekick";
import { SidekickChatMessage } from "~/types";

const QUESTIONS = [
	{ icon: iconCreditCard, title: "How do I manage Cloud billing?" },
	{ icon: iconPlus, title: "How do I create records?" },
	{ icon: iconAccount, title: "How can I authenticate users?" },
	{ icon: iconTransfer, title: "How do I execute transactions?" },
	{ icon: iconTable, title: "How do I design a schema?" },
	{ icon: iconQuery, title: "How do I optimise my database?" },
	{ icon: iconHistory, title: "How do I view my query history?" },
	{ icon: iconStar, title: "How do I save queries?" },
	{ icon: iconDownload, title: "How do I export my database?" },
	{ icon: iconReset, title: "How do I recurse graphs?" },
	{ icon: iconRelation, title: "How do I visualize graphs?" },
	{ icon: iconLive, title: "How do I listen to changes?" },
];

export function SidekickDrawer() {
	const [isOpen, openHandle] = useDisclosure();
	const handleClose = useStable(() => {
		openHandle.close();
	});

	// const conversation = useSidekickConversations(isOpen);

	const [width, setWidth] = useState(650);
	const [showHistory, setShowHistory] = useState(false);
	const isAuthed = useIsAuthenticated();
	const conversation = useCloudStore((s) => s.chatConversation);

	useIntent("open-sidekick", () => {
		openHandle.open();
	});

	return (
		<Drawer
			opened={isOpen}
			onClose={handleClose}
			position="right"
			trapFocus={false}
			size={width}
			padding={0}
			styles={{
				body: {
					height: "100%",
					display: "flex",
					flexDirection: "column",
				},
			}}
		>
			<DrawerResizer
				minSize={500}
				maxSize={1500}
				onResize={setWidth}
				style={{ zIndex: 1000 }}
			/>
			<Stack
				gap={0}
				h="100%"
				w="100%"
			>
				<Group p="xl">
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
					<PrimaryTitle>Sidekick</PrimaryTitle>
					<Spacer />
					{isAuthed && (
						<>
							<Button
								size="xs"
								color="slate"
								variant="light"
								leftSection={<Icon path={showHistory ? iconChat : iconHistory} />}
								onClick={() => {
									setShowHistory((v) => !v);
								}}
							>
								{showHistory ? "Show chat" : "Show history"}
							</Button>
							<Button
								size="xs"
								variant="gradient"
								rightSection={<Icon path={iconPlus} />}
								onClick={() => {
									// openHandle.close();
								}}
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
								<ChatConversation
									conversation={conversation}
									isAuthed={isAuthed}
								/>
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
								<ChatHistory conversation={conversation} />
							</Paper>
						)}
					</Transition>
				</Box>
			</Stack>
		</Drawer>
	);
}

interface ChatConversationProps {
	conversation: SidekickChatMessage[];
	isAuthed: boolean;
}

function ChatConversation({ conversation, isAuthed }: ChatConversationProps) {
	const { pushChatMessage } = useCloudStore.getState();
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const [input, setInput] = useInputState("");
	const profile = useCloudProfile();
	const lastResponse = useCloudStore((s) => s.chatLastResponse);
	const { sendMessage, isResponding } = useCopilotMutation();
	const hasMessage = useMemo(() => input.trim() !== "", [input]);
	const canSend = input && !isResponding && hasMessage;

	const submitMessage = useStable(() => {
		if (!canSend) return;

		if (!isAuthed) {
			openCloudAuthentication();
			return;
		}

		pushChatMessage({
			// id: Math.random().toString(36).slice(2),
			content: input,
			// sender: "user",
			// thinking: "",
			// loading: false,
			sent_at: new Date(),
			type: "user",
		});

		inputRef.current?.focus();
		sendMessage(input);
		setInput("");
	});

	const handleKeyDown = useStable((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			submitMessage();
		}
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: Only want to scroll on conversation change
	useEffect(() => {
		if (scrollRef.current) {
			const { scrollHeight, clientHeight, scrollTop } = scrollRef.current;

			if (scrollHeight - clientHeight - scrollTop < 150) {
				scrollRef.current?.scrollTo({
					top: scrollHeight,
					behavior: "smooth",
				});
			}
		}
	}, [conversation]);

	const questions = useMemo(() => shuffle(QUESTIONS).slice(0, 4), []);

	return (
		<>
			{conversation.length > 0 ? (
				<Box
					flex={1}
					pos="relative"
				>
					<ScrollArea
						pos="absolute"
						viewportRef={scrollRef}
						inset={0}
					>
						<Stack
							p={36}
							pb={96}
							gap={38}
						>
							{conversation.map((message, i) => (
								<ChatMessage
									message={message}
									profile={profile}
									lastResponse={lastResponse}
									isResponding={isResponding}
									isLight={false}
									key={i}
								/>
							))}
						</Stack>
					</ScrollArea>
				</Box>
			) : (
				<Center flex={1}>
					<Stack
						align="center"
						gap={0}
					>
						<Box pos="relative">
							<Image
								pos="absolute"
								src={glowImg}
								inset={0}
								opacity={0.3}
								style={{
									transform: "scale(2)",
									transition: "opacity 0.3s ease",
								}}
							/>
							<Image
								pos="relative"
								src={sidekickImg}
								w={132}
								h={132}
							/>
						</Box>
						<PrimaryTitle
							fz={42}
							mt="md"
						>
							Welcome to Sidekick
						</PrimaryTitle>
						<Text fz="xl">Your personal Surreal assistant designed for you.</Text>
						<Stack
							mt={36}
							w={450}
							style={{ alignSelf: "stretch" }}
						>
							{isAuthed ? (
								questions.map((question) => (
									<Paper
										p="sm"
										key={question.title}
										role="button"
										radius={100}
										tabIndex={0}
										variant="interactive"
										style={{
											alignSelf: "stretch",
										}}
										onClick={() => {
											setInput(question.title);
											inputRef.current?.focus();
										}}
									>
										<Group
											align="center"
											wrap="nowrap"
										>
											<ThemeIcon
												radius={100}
												color="violet"
												variant="light"
												size="lg"
											>
												<Icon
													path={question.icon}
													size="md"
												/>
											</ThemeIcon>
											<PrimaryTitle
												c="bright"
												fw={500}
												fz="xl"
												pr="md"
											>
												{question.title}
											</PrimaryTitle>
										</Group>
									</Paper>
								))
							) : (
								<Group
									w="100%"
									maw={450}
								>
									<Button
										flex={1}
										variant="gradient"
										onClick={openCloudAuthentication}
										rightSection={<Icon path={iconChevronRight} />}
									>
										Sign in
									</Button>
									<Button
										flex={1}
										color="slate"
										variant="light"
										rightSection={<Icon path={iconOpen} />}
										onClick={() =>
											adapter.openUrl("https://surrealdb.com/sidekick")
										}
									>
										Learn more
									</Button>
								</Group>
							)}
						</Stack>
					</Stack>
				</Center>
			)}
			<Box
				px="xl"
				pb="xl"
			>
				<Paper
					bg="slate.9"
					p="md"
				>
					<Group mb="xs">
						<Button
							leftSection={<Icon path={iconTable} />}
							variant="light"
							color="slate"
							size="xs"
						>
							Attach schema
						</Button>
						<Button
							leftSection={<Icon path={iconTable} />}
							variant="light"
							color="slate"
							size="xs"
						>
							Attach table
						</Button>
						<Button
							leftSection={<Icon path={iconRelation} />}
							variant="light"
							color="slate"
							size="xs"
						>
							Attach relation
						</Button>
					</Group>
					<Group
						wrap="nowrap"
						align="end"
					>
						<Textarea
							ref={inputRef}
							flex={1}
							rows={1}
							maxRows={12}
							autosize
							className={classes.sidekickInput}
							placeholder="Send a message..."
							onKeyDown={handleKeyDown}
							value={input}
							autoFocus
							onChange={setInput}
							rightSectionWidth={96}
							variant="unstyled"
						/>
						<ActionIcon
							size="lg"
							type="submit"
							variant="gradient"
							disabled={!canSend}
							onClick={submitMessage}
							loading={isResponding}
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
					</Group>
				</Paper>
			</Box>
		</>
	);
}

interface ChatHistoryProps {
	conversation: SidekickChatMessage[];
}

function ChatHistory({ conversation }: ChatHistoryProps) {
	return (
		<Stack>
			{/* {conversation.map((message) => (
				<ChatMessage
					message={message}
					profile={profile}
					lastResponse={lastResponse}
					isResponding={isResponding}
					isLight={false}
				/>
			))} */}
		</Stack>
	);
}
