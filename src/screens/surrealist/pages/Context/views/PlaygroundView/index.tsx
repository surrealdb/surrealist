import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Divider,
	Group,
	Loader,
	Paper,
	ScrollArea,
	Skeleton,
	Stack,
	Text,
	Textarea,
	ThemeIcon,
	Tooltip,
} from "@mantine/core";
import type { Spectron } from "@surrealdb/spectron";
import {
	Icon,
	iconAccount,
	iconAutoFix,
	iconBookmark,
	iconChat,
	iconHistory,
	iconMemory,
	iconRefresh,
	iconRelation,
	iconSend,
	iconTag,
	iconWarning,
	SectionTitle,
} from "@surrealdb/ui";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { showErrorNotification } from "~/util/helpers";
import { EmptyState, SpectronGate } from "../../components/feedback";
import type { ContextViewProps } from "../../types";
import classes from "./style.module.scss";

// ─── SDK-derived types (inferred from method returns) ───

// `chat` is overloaded (non-streaming vs `{ stream: true }`). A plain
// `ReturnType` collapses to the last (streaming) overload, so this matches the
// FIRST call signature to recover the non-streaming `ChatResponseJson` shape —
// the one that carries `memoryUpdates`.
type FirstChatReturn<T> = T extends {
	(message: string, options?: infer _O): infer R;
	(message: string, options: infer _O2): infer _R2;
}
	? R
	: never;

type ChatResponse = Awaited<FirstChatReturn<Spectron["chat"]>>;
type RecallResult = Awaited<ReturnType<Spectron["recall"]>>;
type MemoryHit = RecallResult["hits"][number];
type ExtractionResult = ChatResponse["memoryUpdates"];
type SessionHandle = Awaited<ReturnType<Spectron["sessions"]["create"]>>;

interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	traceId?: string;
	fresh?: boolean;
}

const EXAMPLE_PROMPTS = [
	"My name is Alex and I prefer dark mode.",
	"I work at Acme as a CTO.",
	"What do you know about me?",
	"Remind me to review the Q3 roadmap on Friday.",
];

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

// ─── Live playground (client guaranteed ready) ───

function Playground({ client }: { client: Spectron; context: ContextViewProps["context"] }) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [recalled, setRecalled] = useState<MemoryHit[]>([]);
	const [learned, setLearned] = useState<ExtractionResult | null>(null);
	const [busy, setBusy] = useState(false);
	const [recalling, setRecalling] = useState(false);

	const sessionRef = useRef<SessionHandle | null>(null);
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

	const resetSession = useCallback(() => {
		const previous = sessionRef.current;
		sessionRef.current = null;
		setMessages([]);
		setRecalled([]);
		setLearned(null);
		setInput("");
		// Best-effort server-side cleanup; ignore failures.
		previous?.close().catch(() => {});
	}, []);

	const send = useCallback(
		async (raw: string) => {
			const text = raw.trim();
			if (!text || busy) return;

			setInput("");
			setMessages((prev) => [
				...prev,
				{ id: crypto.randomUUID(), role: "user", content: text },
			]);
			setLearned(null);
			setBusy(true);
			setRecalling(true);

			try {
				// Lazily open a session on first send.
				if (!sessionRef.current) {
					sessionRef.current = await client.sessions.create({});
				}
				const sessionId = sessionRef.current.id;

				// Recall (what the agent retrieves) + chat (the reply + what it
				// learns) run concurrently. Non-streaming chat is used so the
				// `memoryUpdates` payload — the whole point of the Learned panel —
				// is always populated.
				const recallPromise = client
					.recall(text, { k: 6, sessionId })
					.then((res) => {
						setRecalled(res.hits);
					})
					.finally(() => setRecalling(false));

				const chatPromise = client.chat(text, { sessionId });

				// `res.sessionId` echoes the id we attached the turn to; the
				// session handle already carries it, so no reassignment needed.
				const [, res] = await Promise.all([recallPromise, chatPromise]);

				setMessages((prev) => [
					...prev,
					{
						id: crypto.randomUUID(),
						role: "assistant",
						content: res.reply,
						traceId: res.traceId,
						fresh: true,
					},
				]);
				setLearned(res.memoryUpdates);
			} catch (err) {
				showErrorNotification({ title: "Chat failed", content: err });
			} finally {
				setBusy(false);
				setRecalling(false);
			}
		},
		[busy, client],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				void send(input);
			}
		},
		[input, send],
	);

	const hasConversation = messages.length > 0 || recalled.length > 0 || learned !== null;

	return (
		<Box className={classes.workspace}>
			<Paper
				withBorder
				radius="md"
				className={classes.chatPaper}
			>
				<Group
					justify="space-between"
					px="md"
					py="sm"
				>
					<Group gap="xs">
						<ThemeIcon
							size={28}
							radius="md"
							variant="light"
							color="violet"
						>
							<Icon path={iconChat} />
						</ThemeIcon>
						<Text
							fw={600}
							c="bright"
						>
							Conversation
						</Text>
					</Group>
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

				<Divider color="obsidian.5" />

				<ScrollArea
					className={classes.thread}
					viewportRef={viewportRef}
				>
					<Box className={classes.threadInner}>
						{messages.length === 0 ? (
							<EmptyState
								icon={iconChat}
								title="Say something to your agent"
								description="Tell it about yourself, then ask what it remembers. Each message is grounded in recalled memory and may teach it something new."
								action={
									<Group
										justify="center"
										gap="xs"
										mt="xs"
									>
										{EXAMPLE_PROMPTS.map((prompt) => (
											<Button
												key={prompt}
												size="xs"
												variant="default"
												className={classes.promptChip}
												onClick={() => setInput(prompt)}
											>
												{prompt}
											</Button>
										))}
									</Group>
								}
							/>
						) : (
							messages.map((msg) => (
								<ChatBubble
									key={msg.id}
									message={msg}
								/>
							))
						)}
						{busy && <PendingBubble />}
					</Box>
				</ScrollArea>

				<Group
					className={classes.composer}
					gap="sm"
					p="md"
					align="flex-end"
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
						size={38}
						radius="md"
						variant="gradient"
						onClick={() => void send(input)}
						disabled={busy || !input.trim()}
						aria-label="Send message"
					>
						{busy ? (
							<Loader
								size="xs"
								color="white"
							/>
						) : (
							<Icon path={iconSend} />
						)}
					</ActionIcon>
				</Group>
			</Paper>

			<Paper
				withBorder
				radius="md"
				className={classes.activityPaper}
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
						<Divider color="obsidian.5" />
						<LearnedSection learned={learned} />
					</Stack>
				</ScrollArea>
			</Paper>
		</Box>
	);
}

// ─── Chat bubbles ───

function ChatBubble({ message }: { message: ChatMessage }) {
	if (message.role === "user") {
		return (
			<Box className={`${classes.bubbleRow} ${classes.bubbleRowUser}`}>
				<Box className={`${classes.userBubble} selectable`}>
					<Text
						fz="sm"
						style={{ whiteSpace: "pre-wrap" }}
					>
						{message.content}
					</Text>
				</Box>
				<ThemeIcon
					size={28}
					radius="xl"
					variant="light"
					color="slate"
				>
					<Icon path={iconAccount} />
				</ThemeIcon>
			</Box>
		);
	}

	return (
		<Box className={classes.bubbleRow}>
			<Box className={classes.avatar}>
				<Icon
					path={iconAutoFix}
					c="violet.3"
				/>
			</Box>
			<Stack
				gap={4}
				maw="84%"
			>
				<Box
					className={`${classes.assistantBubble} ${message.fresh ? classes.fadeIn : ""} selectable`}
				>
					<Text
						fz="sm"
						style={{ whiteSpace: "pre-wrap" }}
					>
						{message.content}
					</Text>
				</Box>
				{message.traceId && (
					<Text
						className={`${classes.trace} selectable`}
						title="Retrieval trace for this reply"
					>
						trace: {message.traceId}
					</Text>
				)}
			</Stack>
		</Box>
	);
}

function PendingBubble() {
	return (
		<Box className={classes.bubbleRow}>
			<Box className={classes.avatar}>
				<Icon
					path={iconAutoFix}
					c="violet.3"
				/>
			</Box>
			<Box className={classes.assistantBubble}>
				<Group gap="xs">
					<Loader
						size="xs"
						type="dots"
						color="violet"
					/>
					<Text
						fz="sm"
						c="slate"
					>
						Thinking…
					</Text>
				</Group>
			</Box>
		</Box>
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
					c="violet.3"
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
						aria-hidden
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
										{" —"}
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
					variant="default"
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
