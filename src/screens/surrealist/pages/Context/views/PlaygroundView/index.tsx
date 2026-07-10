import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Center,
	Divider,
	Group,
	Image,
	List,
	Loader,
	Paper,
	Popover,
	ScrollArea,
	Skeleton,
	Stack,
	Text,
	Textarea,
	Title,
	Tooltip,
} from "@mantine/core";
import type { Spectron } from "@surrealdb/spectron";
import {
	Icon,
	iconBookmark,
	iconChat,
	iconCursor,
	iconHelp,
	iconHistory,
	iconMemory,
	iconOpen,
	iconRefresh,
	iconRelation,
	iconTag,
	iconText,
	iconUpload,
	iconWarning,
	MarkdownViewer,
	pictoSpectronGradient,
	SectionTitle,
} from "@surrealdb/ui";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { adapter } from "~/adapter";
import { ContentPane } from "~/components/Pane";
import { useIsLight } from "~/hooks/theme";
import { useConfirmation } from "~/providers/Confirmation";
import {
	type ChatMessage,
	type ExtractionResult,
	type MemoryHit,
	usePlaygroundStore,
} from "~/stores/playground";
import { showErrorNotification, showInfo } from "~/util/helpers";
import { SpectronGate } from "../../components/feedback";
import type { ContextViewProps } from "../../types";
import classes from "./style.module.scss";

const EXAMPLE_PROMPTS = [
	"My name is Alex and I prefer dark mode.",
	"I work at Acme as a CTO.",
	"What do you know about me?",
	"Remind me to review the Q3 roadmap on Friday.",
];

// Stable empty fallbacks so selecting a not-yet-seeded conversation doesn't
// return a fresh array on every render (which would thrash memoised children).
const EMPTY_MESSAGES: ChatMessage[] = [];
const EMPTY_HITS: MemoryHit[] = [];

// ─── Page shell ───

export default function PlaygroundView({ context }: ContextViewProps) {
	return (
		<Box className={classes.root}>
			<SpectronGate loadingMessage="Connecting to the playground…">
				{(client) => (
					<Playground
						client={client}
						context={context}
					/>
				)}
			</SpectronGate>
		</Box>
	);
}

// ─── Playground help ───

// In-app explainer for the Playground — what it is, how to read the activity
// panel, and (the most common question) whether you can ask about uploaded
// documents. The full guide lives in the docs site. (#755)
function PlaygroundHelp() {
	return (
		<Popover
			width={340}
			position="bottom-end"
			withArrow
			shadow="md"
		>
			<Popover.Target>
				<Button
					size="xs"
					variant="subtle"
					color="slate"
					leftSection={<Icon path={iconHelp} />}
				>
					How it works
				</Button>
			</Popover.Target>
			<Popover.Dropdown>
				<Stack gap="sm">
					<Text
						fw={600}
						c="bright"
					>
						How the Playground works
					</Text>
					<List
						spacing="xs"
						fz="sm"
						withPadding
					>
						<List.Item>
							Chat with your agent in real time. Every reply is grounded in what this
							context remembers.
						</List.Item>
						<List.Item>
							The <b>Memory activity</b> panel shows what was recalled for each
							message and what the agent just learned.
						</List.Item>
						<List.Item>
							<b>You can ask about your documents.</b> Anything uploaded in the
							Documents view is retrieved and used to ground answers, with sources it
							can cite.
						</List.Item>
					</List>
					<Button
						variant="light"
						size="xs"
						rightSection={<Icon path={iconOpen} />}
						onClick={() => adapter.openUrl("https://surrealdb.com/docs/spectron")}
					>
						Read the docs
					</Button>
				</Stack>
			</Popover.Dropdown>
		</Popover>
	);
}

// ─── Live playground (client guaranteed ready) ───

function Playground({ client }: { client: Spectron; context: ContextViewProps["context"] }) {
	const isLight = useIsLight();
	const glassColor = isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.05)";
	const contextId = client.contextId;

	// Conversation state lives in a store keyed by context id, so leaving the
	// Playground and returning restores the thread — and a reply that is still
	// processing lands in the store instead of being discarded. (#734)
	const conversation = usePlaygroundStore((s) => s.conversations[contextId]);
	const setInputStore = usePlaygroundStore((s) => s.setInput);
	const sendMessage = usePlaygroundStore((s) => s.send);
	const retryMessage = usePlaygroundStore((s) => s.retry);
	const resetConversation = usePlaygroundStore((s) => s.reset);

	const messages = conversation?.messages ?? EMPTY_MESSAGES;
	const input = conversation?.input ?? "";
	const recalled = conversation?.recalled ?? EMPTY_HITS;
	const learned = conversation?.learned ?? null;
	const busy = conversation?.busy ?? false;
	const recalling = conversation?.recalling ?? false;

	const viewportRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = useCallback(() => {
		requestAnimationFrame(() => {
			viewportRef.current?.scrollTo({
				top: viewportRef.current.scrollHeight,
				behavior: "smooth",
			});
		});
	}, []);

	// Auto-scroll whenever the thread grows or the pending bubble toggles.
	const threadLength = messages.length;
	useEffect(() => {
		if (threadLength > 0 || busy) {
			scrollToBottom();
		}
	}, [scrollToBottom, threadLength, busy]);

	// When the user switches to a different context while the Playground stays
	// mounted, close the previous context's session so handles don't accumulate.
	// Navigating to another view in the SAME context unmounts this component
	// without changing contextId, so the conversation still survives. (#734)
	const previousContextId = useRef(contextId);
	useEffect(() => {
		if (previousContextId.current !== contextId) {
			resetConversation(previousContextId.current);
			previousContextId.current = contextId;
		}
	}, [contextId, resetConversation]);

	const setInput = useCallback(
		(value: string) => setInputStore(contextId, value),
		[setInputStore, contextId],
	);

	const resetSession = useCallback(
		() => resetConversation(contextId),
		[resetConversation, contextId],
	);

	const send = useCallback(
		(raw: string) => {
			void sendMessage(contextId, client, raw);
		},
		[sendMessage, contextId, client],
	);

	const retry = useCallback(
		(messageId: string) => {
			void retryMessage(contextId, client, messageId);
		},
		[retryMessage, contextId, client],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				send(input);
			}
		},
		[input, send],
	);

	// ── Add documents straight from the chat: drag-and-drop a file (#751) or
	// save a message as an authoritative document (#753). Both go to the
	// context's document store via the same upload path the Documents view uses.
	const [dragging, setDragging] = useState(false);

	const uploadFiles = useCallback(
		async (files: File[]) => {
			if (files.length === 0) return;
			let uploaded = 0;
			for (const file of files) {
				try {
					await client.documents.upload({
						file,
						filename: file.name,
						title: file.name,
						contentType: file.type || undefined,
					});
					uploaded++;
				} catch (err) {
					showErrorNotification({
						title: `Couldn't upload ${file.name}`,
						content: err,
					});
				}
			}
			if (uploaded > 0) {
				showInfo({
					title: uploaded === 1 ? "Document uploaded" : `${uploaded} documents uploaded`,
					subtitle: "Spectron is processing it and will ground future answers in it.",
				});
			}
		},
		[client],
	);

	const confirmSaveAsDocument = useConfirmation<string>({
		title: "Save as document",
		message:
			"Add this message to the context as an authoritative document? Spectron will parse, embed, and use it to ground future answers.",
		confirmText: "Save",
		confirmProps: { variant: "gradient" },
		skippable: true,
		onConfirm: async (content) => {
			const file = new File([content], `chat-message-${Date.now()}.md`, {
				type: "text/markdown",
			});
			await uploadFiles([file]);
		},
	});

	const handleDragOver = (event: React.DragEvent) => {
		if (!event.dataTransfer.types.includes("Files")) return;
		event.preventDefault();
		setDragging(true);
	};

	const handleDragLeave = (event: React.DragEvent) => {
		// Ignore moves between children; only clear when the cursor truly leaves.
		if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
			setDragging(false);
		}
	};

	const handleDrop = (event: React.DragEvent) => {
		if (!event.dataTransfer.types.includes("Files")) return;
		event.preventDefault();
		setDragging(false);
		void uploadFiles(Array.from(event.dataTransfer.files));
	};

	const hasConversation = messages.length > 0 || recalled.length > 0 || learned !== null;
	const showWelcome = messages.length === 0 && !busy;
	const canSend = !busy && input.trim().length > 0;

	return (
		<Box className={classes.workspace}>
			<ContentPane
				className={classes.chatPane}
				title="Playground"
				icon={iconChat}
				p={0}
				withTopPadding={false}
				rightSection={
					<Group gap="xs">
						<PlaygroundHelp />
						<Tooltip label="Start a fresh session">
							<Button
								size="xs"
								variant="subtle"
								color="slate"
								leftSection={<Icon path={iconRefresh} />}
								onClick={resetSession}
								disabled={busy || !hasConversation}
							>
								New session
							</Button>
						</Tooltip>
					</Group>
				}
			>
				<Box
					className={classes.chatBody}
					pos="relative"
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
				>
					{dragging && (
						<Center className={classes.dropOverlay}>
							<Stack
								align="center"
								gap="xs"
							>
								<Icon
									path={iconUpload}
									size="xl"
									c="violet"
								/>
								<Text
									fw={600}
									c="bright"
								>
									Drop files to add them to this context
								</Text>
							</Stack>
						</Center>
					)}
					<Box
						flex={1}
						pos="relative"
						className={classes.thread}
					>
						{showWelcome ? (
							<Center
								pos="absolute"
								inset={0}
							>
								<Stack
									align="center"
									maw={420}
									px="xl"
								>
									<Image
										pos="relative"
										src={pictoSpectronGradient}
										w={55}
										h={55}
										alt="Spectron"
										aria-hidden
										mb="sm"
									/>
									<Title
										c="bright"
										fw="bold"
										fz={30}
										ta="center"
									>
										Try your agent
									</Title>
									<Text
										fz="sm"
										ta="center"
										className="selectable"
									>
										Tell it about yourself, then ask what it remembers. Each
										reply is grounded in recalled memory and any documents
										you've uploaded, and it may pick up something new along the
										way.
									</Text>
									<Stack
										mt={36}
										w={375}
										gap="sm"
									>
										{EXAMPLE_PROMPTS.map((prompt) => (
											<Paper
												key={prompt}
												p="sm"
												role="button"
												radius={100}
												tabIndex={0}
												onClick={() => setInput(prompt)}
												onKeyDown={(e) => {
													if (e.key === "Enter" || e.key === " ") {
														e.preventDefault();
														setInput(prompt);
													}
												}}
												style={{
													cursor: "pointer",
													backgroundColor: glassColor,
												}}
											>
												<Text
													c="bright"
													fw={500}
													fz="md"
													ta="center"
												>
													{prompt}
												</Text>
											</Paper>
										))}
									</Stack>
								</Stack>
							</Center>
						) : (
							<ScrollArea
								pos="absolute"
								inset={0}
								viewportRef={viewportRef}
							>
								<Box className={classes.threadInner}>
									{messages.map((msg) => (
										<ChatBubble
											key={msg.id}
											message={msg}
											isLight={isLight}
											busy={busy}
											onRetry={() => retry(msg.id)}
											onSaveAsDocument={() =>
												confirmSaveAsDocument(msg.content)
											}
										/>
									))}
									{busy && <PendingBubble />}
								</Box>
							</ScrollArea>
						)}
					</Box>

					<Box
						className={classes.composer}
						px="xl"
						pb="xl"
					>
						<Group
							gap="sm"
							align="center"
							wrap="nowrap"
						>
							<Textarea
								flex={1}
								placeholder="Message your agent…"
								value={input}
								onChange={(e) => setInput(e.currentTarget.value)}
								onKeyDown={handleKeyDown}
								autosize
								minRows={1}
								maxRows={5}
								disabled={busy}
								aria-label="Message"
							/>
							<ActionIcon
								size="xl"
								variant="gradient"
								onClick={() => void send(input)}
								disabled={!canSend}
								loading={busy}
								aria-label="Send message"
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
					</Box>
				</Box>
			</ContentPane>

			<ContentPane
				className={classes.activityPane}
				p={0}
				withTopPadding={false}
				withDivider={false}
			>
				<Box
					px="lg"
					pt="lg"
					pb="sm"
				>
					<SectionTitle
						kicker="Glass box"
						order={3}
					>
						Memory activity
					</SectionTitle>
				</Box>

				<ScrollArea
					className={classes.activityScroll}
					px="lg"
					pb="lg"
				>
					<Stack gap="xl">
						<RecalledSection
							hits={recalled}
							recalling={recalling}
						/>
						<Divider />
						<LearnedSection learned={learned} />
					</Stack>
				</ScrollArea>
			</ContentPane>
		</Box>
	);
}

// ─── Chat bubbles ───

function ChatBubble({
	message,
	isLight,
	busy,
	onRetry,
	onSaveAsDocument,
}: {
	message: ChatMessage;
	isLight: boolean;
	busy: boolean;
	onRetry: () => void;
	onSaveAsDocument: () => void;
}) {
	const saveAction = (
		<Tooltip label="Save as document">
			<ActionIcon
				variant="subtle"
				color="slate"
				size="sm"
				className={classes.messageAction}
				aria-label="Save this message as a document"
				onClick={onSaveAsDocument}
			>
				<Icon path={iconText} />
			</ActionIcon>
		</Tooltip>
	);

	if (message.role === "user") {
		return (
			<Paper
				p="md"
				bg={isLight ? "obsidian.1" : "obsidian.6"}
				className={`${classes.message} selectable`}
				style={
					message.failed ? { border: "1px solid var(--mantine-color-red-5)" } : undefined
				}
			>
				<Group
					justify="space-between"
					align="flex-start"
					gap="xs"
					wrap="nowrap"
				>
					<Box flex={1}>
						<MarkdownViewer content={message.content} />
					</Box>
					{saveAction}
				</Group>
				{message.failed && (
					<Group
						justify="space-between"
						gap="xs"
						mt="xs"
						wrap="nowrap"
					>
						<Group
							gap={6}
							wrap="nowrap"
						>
							<Icon
								path={iconWarning}
								size="sm"
								c="red"
							/>
							<Text
								fz="xs"
								c="red"
							>
								No reply, this turn failed.
							</Text>
						</Group>
						<Button
							size="compact-xs"
							variant="light"
							color="red"
							leftSection={<Icon path={iconRefresh} />}
							onClick={onRetry}
							disabled={busy}
						>
							Retry
						</Button>
					</Group>
				)}
			</Paper>
		);
	}

	return (
		<Box
			mb="md"
			className={`${classes.message} ${message.fresh ? classes.fadeIn : ""}`}
		>
			<Group
				justify="space-between"
				align="flex-start"
				gap="xs"
				wrap="nowrap"
			>
				<Box
					flex={1}
					className="selectable"
				>
					<MarkdownViewer content={message.content} />
				</Box>
				{saveAction}
			</Group>
			{message.traceId && (
				<Text
					mt={4}
					className={`${classes.trace} selectable`}
					title="Retrieval trace for this reply"
				>
					trace: {message.traceId}
				</Text>
			)}
		</Box>
	);
}

function PendingBubble() {
	return (
		<Group
			gap="xs"
			mb="md"
			c="obsidian"
		>
			<Loader
				size={14}
				color="currentColor"
			/>
			<Text
				fz="lg"
				inherit
			>
				Thinking…
			</Text>
		</Group>
	);
}

// ─── Recalled section ───

function SectionHeader({
	icon,
	label,
	count,
	live,
}: {
	icon: string;
	label: string;
	count: number;
	live?: boolean;
}) {
	return (
		<Group
			justify="space-between"
			mb="sm"
		>
			<Group gap="xs">
				<Icon
					path={icon}
					c="violet"
				/>
				<Text
					fw={600}
					c="bright"
				>
					{label}
				</Text>
			</Group>
			<Group gap={8}>
				{live && (
					<Box
						className={classes.pulseDot}
						aria-hidden={true}
					/>
				)}
				<Badge
					variant={count > 0 ? "light" : "default"}
					color={count > 0 ? "violet" : "slate"}
					size="sm"
				>
					{count}
				</Badge>
			</Group>
		</Group>
	);
}

function RecalledSection({ hits, recalling }: { hits: MemoryHit[]; recalling: boolean }) {
	return (
		<Box className={classes.activitySection}>
			<SectionHeader
				icon={iconHistory}
				label="Recalled"
				count={hits.length}
				live={recalling}
			/>
			{recalling ? (
				<Stack gap="xs">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton
							key={i}
							h={58}
							radius="md"
						/>
					))}
				</Stack>
			) : hits.length === 0 ? (
				<Text
					fz="sm"
					c="slate"
				>
					No memories recalled yet.
				</Text>
			) : (
				<Stack gap="xs">
					{hits.map((hit) => (
						<HitCard
							key={hit.id}
							hit={hit}
						/>
					))}
				</Stack>
			)}
		</Box>
	);
}

function HitCard({ hit }: { hit: MemoryHit }) {
	const [expanded, setExpanded] = useState(false);

	return (
		<Paper
			p="sm"
			radius="md"
			withBorder
			className={classes.hitCard}
		>
			<Group
				justify="space-between"
				align="flex-start"
				gap="xs"
				wrap="nowrap"
				mb={6}
			>
				<Badge
					variant="light"
					color="slate"
					size="xs"
					tt="lowercase"
				>
					{hit.source}
				</Badge>
				<Badge
					variant="light"
					color="violet"
					size="xs"
				>
					{hit.score.toFixed(2)}
				</Badge>
			</Group>
			<Text
				fz="sm"
				c="bright"
				className={`${expanded ? "" : classes.clamp} selectable`}
				onClick={() => setExpanded((v) => !v)}
				style={{ cursor: "pointer" }}
			>
				{hit.text}
			</Text>
		</Paper>
	);
}

// ─── Learned section ───

function pillCount(learned: ExtractionResult): number {
	return (
		learned.entities.length +
		learned.attributes.length +
		learned.relations.length +
		learned.instructions.length +
		learned.uncertainties.length +
		learned.corrections.length
	);
}

function LearnedSection({ learned }: { learned: ExtractionResult | null }) {
	const total = learned ? pillCount(learned) : 0;

	return (
		<Box className={classes.activitySection}>
			<SectionHeader
				icon={iconMemory}
				label="Learned"
				count={total}
			/>
			{!learned ? (
				<Text
					fz="sm"
					c="slate"
				>
					Send a message to see what your agent learns.
				</Text>
			) : total === 0 ? (
				<Text
					fz="sm"
					c="slate"
				>
					Nothing new learned from that message.
				</Text>
			) : (
				<Stack gap="md">
					<LearnedGroup
						icon={iconMemory}
						label="Entities"
						items={learned.entities.map((e) => ({
							key: e.id,
							node: (
								<>
									{e.name}
									{e.entityType && (
										<Text
											span
											c="slate"
										>
											{" · "}
											{e.entityType}
										</Text>
									)}
								</>
							),
							isNew: e.isNew,
						}))}
					/>
					<LearnedGroup
						icon={iconTag}
						label="Attributes"
						items={learned.attributes.map((a) => ({
							key: a.id,
							node: (
								<>
									<Text
										span
										c="slate"
									>
										{a.key}
										{" = "}
									</Text>
									{a.value}
								</>
							),
						}))}
					/>
					<LearnedGroup
						icon={iconRelation}
						label="Relations"
						items={learned.relations.map((r, i) => ({
							key: `${r.subject}-${r.label}-${r.object}-${i}`,
							node: (
								<>
									{r.subject}
									<Text
										span
										c="violet.3"
									>
										{" →"}
										{r.label}
										{"→ "}
									</Text>
									{r.object}
								</>
							),
						}))}
					/>
					<LearnedGroup
						icon={iconBookmark}
						label="Instructions"
						items={learned.instructions.map((ins) => ({
							key: ins.id,
							node: (
								<Tooltip
									label={ins.description}
									disabled={!ins.description}
									multiline
									maw={280}
								>
									<Text span>{ins.label}</Text>
								</Tooltip>
							),
						}))}
					/>
					<LearnedGroup
						icon={iconRefresh}
						label="Corrections"
						items={learned.corrections.map((c, i) => ({
							key: `${c.entityId}-${c.key}-${i}`,
							node: (
								<>
									<Text
										span
										c="slate"
									>
										{c.key}:{" "}
									</Text>
									<Text
										span
										td="line-through"
										c="slate"
									>
										{c.oldValue}
									</Text>
									{" → "}
									{c.newValue}
								</>
							),
						}))}
					/>
					<LearnedGroup
						icon={iconWarning}
						label="Uncertainties"
						color="orange"
						items={learned.uncertainties.map((u, i) => ({
							key: `${u.about}-${i}`,
							node: (
								<Tooltip
									label={u.reason}
									disabled={!u.reason}
									multiline
									maw={280}
								>
									<Text span>{u.about}</Text>
								</Tooltip>
							),
						}))}
					/>
				</Stack>
			)}
		</Box>
	);
}

interface LearnedItem {
	key: string;
	node: ReactNode;
	isNew?: boolean;
}

function LearnedGroup({
	icon,
	label,
	items,
	color = "violet",
}: {
	icon: string;
	label: string;
	items: LearnedItem[];
	color?: string;
}) {
	if (items.length === 0) {
		return null;
	}

	return (
		<Box>
			<Group
				gap={6}
				mb={6}
			>
				<Icon
					path={icon}
					size="sm"
					c="slate"
				/>
				<Text
					fz="xs"
					fw={600}
					tt="uppercase"
					c="slate"
					style={{ letterSpacing: "0.05em" }}
				>
					{label}
				</Text>
				<Badge
					size="xs"
					color="slate"
				>
					{items.length}
				</Badge>
			</Group>
			<Group gap={6}>
				{items.map((item) => (
					<Badge
						key={item.key}
						variant="light"
						color={color}
						size="md"
						radius="sm"
						tt="none"
						styles={{ label: { fontWeight: 500 } }}
						rightSection={
							item.isNew ? (
								<Text
									span
									fz={9}
									fw={700}
									c="violet.3"
								>
									NEW
								</Text>
							) : undefined
						}
					>
						{item.node}
					</Badge>
				))}
			</Group>
		</Box>
	);
}
