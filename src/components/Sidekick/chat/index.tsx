import {
	ActionIcon,
	Box,
	Button,
	Center,
	Group,
	Image,
	Paper,
	ScrollArea,
	Stack,
	Text,
	Textarea,
	ThemeIcon,
	Title,
} from "@mantine/core";
import { Icon, iconChevronRight, iconCursor, iconOpen, pictoSidekick } from "@surrealdb/ui";
import { shuffle } from "radash";
import { useEffect, useMemo, useRef } from "react";
import { adapter } from "~/adapter";
import glowImg from "~/assets/images/radial-glow.png";
import { openCloudAuthentication } from "~/cloud/api/auth";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useSidekickStore } from "~/stores/sidekick";
import { SIDEKICK_QUESTIONS } from "../helpers";
import { SidekickStream } from "../stream";
import { SidekickMessage } from "./message";

export interface ChatConversationProps {
	isAuthed: boolean;
	stream: SidekickStream;
	padding?: number;
}

export function SidekickChat({ isAuthed, padding, stream }: ChatConversationProps) {
	const { startRequest, completeRequest } = useSidekickStore.getState();

	const isLight = useIsLight();
	const activeId = useSidekickStore((state) => state.activeId);
	const activeHistory = useSidekickStore((state) => state.activeHistory);
	const activeRequest = useSidekickStore((state) => state.activeRequest);
	const activeResponse = useSidekickStore((state) => state.activeResponse);
	const currentPrompt = useSidekickStore((state) => state.currentPrompt);
	const thinkingText = useSidekickStore((state) => state.thinkingText);

	const { updatePrompt } = useSidekickStore.getState();

	const inputRef = useRef<HTMLTextAreaElement>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const hasMessage = useMemo(() => currentPrompt.trim() !== "", [currentPrompt]);

	const canSend = !stream.isResponding && hasMessage;

	const submitMessage = useStable(async (message: string) => {
		if (!isAuthed) {
			openCloudAuthentication();
			return;
		}

		inputRef.current?.focus();
		startRequest(message);

		await stream.sendMessage(message, activeId?.id.toString());

		completeRequest();
	});

	const handleKeyDown = useStable((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();

			if (canSend) {
				submitMessage(currentPrompt);
			}
		}
	});

	const scrollToBottom = useStable((force: boolean) => {
		if (!scrollRef.current) return;
		const { scrollHeight, clientHeight, scrollTop } = scrollRef.current;

		if (force || scrollHeight - clientHeight - scrollTop < 150) {
			scrollRef.current?.scrollTo({
				top: scrollHeight,
				behavior: force ? "instant" : "smooth",
			});
		}
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: Scroll down forcefully on conversation change
	useEffect(() => {
		scrollToBottom(true);
		inputRef.current?.focus();
	}, [activeId]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Scroll down on message change
	useEffect(() => {
		scrollToBottom(false);
	}, [activeHistory, activeRequest, activeResponse]);

	const questions = useMemo(() => shuffle(SIDEKICK_QUESTIONS).slice(0, 4), []);
	const showPrompts = !activeRequest && !activeResponse && activeHistory.length === 0;

	const glassColor = isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.05)";

	return (
		<>
			{showPrompts ? (
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
								opacity={0.5}
								style={{
									transform: "scale(2.5)",
									transition: "opacity 0.3s ease",
								}}
							/>
							<Image
								pos="relative"
								src={pictoSidekick}
								w={55}
								h={55}
							/>
						</Box>
						<Title
							c="bright"
							fw="bold"
							fz={30}
							mt="xl"
						>
							Welcome to Sidekick
						</Title>
						<Text>Your personal Surreal assistant designed for you.</Text>
						<Stack
							mt={36}
							w={375}
							align="center"
						>
							{isAuthed ? (
								questions.map((question) => (
									<Paper
										w="100%"
										p="sm"
										key={question.title}
										role="button"
										radius={100}
										tabIndex={0}
										onClick={() => submitMessage(question.title)}
										style={{
											cursor: "pointer",
											backgroundColor: glassColor,
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
											<Text
												c="bright"
												fw={500}
												fz="lg"
											>
												{question.title}
											</Text>
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
										color="obsidian"
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
			) : (
				<Box
					flex={1}
					pos="relative"
				>
					<ScrollArea
						pos="absolute"
						viewportRef={scrollRef}
						type="scroll"
						inset={0}
					>
						<Stack
							p={padding ?? "xl"}
							pb={padding ? padding : "xl"}
						>
							{activeHistory.map((message, i) => (
								<SidekickMessage
									key={i}
									message={message}
									thinkingText={thinkingText}
								/>
							))}
							{activeRequest && <SidekickMessage message={activeRequest} />}
							{activeResponse && (
								<SidekickMessage
									message={activeResponse}
									isResponding={stream.isResponding}
									thinkingText={thinkingText}
								/>
							)}
						</Stack>
					</ScrollArea>
				</Box>
			)}
			<Box
				px={padding ?? "xl"}
				pb={padding ?? "xl"}
			>
				<Group
					gap="sm"
					wrap="nowrap"
					align="end"
				>
					<Textarea
						mt="lg"
						bg={glassColor}
						bdrs="xl"
						ref={inputRef}
						flex={1}
						maxRows={4}
						autosize
						placeholder="Send a message..."
						onKeyDown={handleKeyDown}
						value={currentPrompt}
						autoFocus
						onChange={(e) => {
							updatePrompt(e.target.value);
						}}
						variant="unstyled"
						styles={{
							input: {
								color: "var(--mantine-color-bright)",
								padding: "0.5rem 1rem",
								"&:placeholder-shown": {
									color: "red",
									opacity: 0.5,
								},
							},
						}}
						style={{
							border: "1px solid rgba(255, 255, 255, 0.3)",
						}}
					/>
					<ActionIcon
						size="xl"
						type="submit"
						variant="gradient"
						disabled={!canSend}
						onClick={() => submitMessage(currentPrompt)}
						loading={stream.isResponding}
						style={{
							backgroundOrigin: "border-box",
							filter: canSend ? undefined : "saturate(0%)",
							transition: "all 0.1s",
						}}
					>
						<Icon
							size="lg"
							path={iconCursor}
							c="white"
						/>
					</ActionIcon>
				</Group>
				<Text
					opacity={0.8}
					fz={11}
					mt="md"
					ta="center"
				>
					You are chatting with an AI assistant, responses may be inaccurate.
				</Text>
				<Text
					opacity={0.8}
					fz={11}
					ta="center"
				>
					Refrain from submitting sensitive data.
				</Text>
			</Box>
		</>
	);
}
