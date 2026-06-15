import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Center,
	Divider,
	Group,
	Image,
	Loader,
	Paper,
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
	iconHistory,
	iconMemory,
	iconRefresh,
	iconRelation,
	iconTag,
	iconWarning,
	pictoSpectronGradient,
	SectionTitle,
} from "@surrealdb/ui";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { ContentPane } from "~/components/Pane";
import { useIsLight } from "~/hooks/theme";
import { showErrorNotification } from "~/util/helpers";
import { SpectronGate } from "../../components/feedback";
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
	const isLight = useIsLight();
	const glassColor = isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.05)";

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
				}
			>
				<Box className={classes.chatBody}>
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
										reply is grounded in recalled memory and may teach it
										something new.
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
							align="end"
							wrap="nowrap"
						>
							<Textarea
								mt="lg"
								bg={glassColor}
								bdrs="xl"
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
								variant="unstyled"
								styles={{
									input: {
										color: "var(--mantine-color-bright)",
										padding: "0.5rem 1rem",
									},
								}}
								style={{
									border: "1px solid rgba(255, 255, 255, 0.25)",
								}}
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

function ChatBubble({ message, isLight }: { message: ChatMessage; isLight: boolean }) {
	if (message.role === "user") {
		return (
			<Paper
				p="md"
				bg={isLight ? "obsidian.1" : "obsidian.6"}
				className="selectable"
			>
				<Text style={{ whiteSpace: "pre-wrap" }}>{message.content}</Text>
			</Paper>
		);
	}

	return (
		<Box
			mb="md"
			className={message.fresh ? classes.fadeIn : undefined}
		>
			<Text
				className="selectable"
				style={{ whiteSpace: "pre-wrap" }}
			>
				{message.content}
			</Text>
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
