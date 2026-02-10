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
} from "@mantine/core";
import { Icon, iconChevronRight, iconCursor, iconOpen, pictoSidekick } from "@surrealdb/ui";
import { shuffle } from "radash";
import { useEffect, useMemo, useRef } from "react";
import { adapter } from "~/adapter";
import glowImg from "~/assets/images/glow.png";
import { openCloudAuthentication } from "~/cloud/api/auth";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useSidekickStore } from "~/stores/sidekick";
import { PrimaryTitle } from "../../PrimaryTitle";
import { SIDEKICK_QUESTIONS } from "../helpers";
import { SidekickStream } from "../stream";
import classes from "../style.module.scss";
import { SidekickMessage } from "./message";

export interface ChatConversationProps {
	isAuthed: boolean;
	stream: SidekickStream;
	padding?: number;
}

export function SidekickChat({ isAuthed, padding, stream }: ChatConversationProps) {
	const { startRequest, completeRequest } = useSidekickStore.getState();

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
	const isLight = useIsLight();

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
								opacity={0.3}
								style={{
									transform: "scale(2)",
									transition: "opacity 0.3s ease",
								}}
							/>
							<Image
								pos="relative"
								src={pictoSidekick}
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
										onClick={() => submitMessage(question.title)}
										style={{
											alignSelf: "stretch",
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
				<Paper
					bg={isLight ? "slate.0" : "slate.9"}
					p="md"
				>
					{/* <Group mb="xs">
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
					</Group> */}
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
							value={currentPrompt}
							autoFocus
							onChange={(e) => {
								updatePrompt(e.target.value);
							}}
							rightSectionWidth={96}
							variant="unstyled"
						/>
						<ActionIcon
							size="lg"
							type="submit"
							variant="gradient"
							disabled={!canSend}
							onClick={() => submitMessage(currentPrompt)}
							loading={stream.isResponding}
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
				<Text
					opacity={0.8}
					fz="sm"
					mt="xs"
					px="xs"
				>
					You are chatting with an AI assistant, responses may be inaccurate. Refrain from
					submitting sensitive data.
				</Text>
			</Box>
		</>
	);
}
