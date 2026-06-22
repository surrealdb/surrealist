import type { Spectron } from "@surrealdb/spectron";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { showErrorNotification } from "~/util/helpers";

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
export type MemoryHit = RecallResult["hits"][number];
export type ExtractionResult = ChatResponse["memoryUpdates"];
type SessionHandle = Awaited<ReturnType<Spectron["sessions"]["create"]>>;

export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	traceId?: string;
	fresh?: boolean;
}

interface PlaygroundConversation {
	messages: ChatMessage[];
	input: string;
	recalled: MemoryHit[];
	learned: ExtractionResult | null;
	busy: boolean;
	recalling: boolean;
}

/**
 * Live session handles are kept outside the immer store: they are class
 * instances with methods, which immer would freeze (breaking them), and they
 * never need to drive React renders. The store only holds serialisable
 * conversation state.
 */
const sessionHandles = new Map<string, SessionHandle>();

function emptyConversation(): PlaygroundConversation {
	return {
		messages: [],
		input: "",
		recalled: [],
		learned: null,
		busy: false,
		recalling: false,
	};
}

export interface PlaygroundStore {
	/** Conversation state keyed by Spectron context id. */
	conversations: Record<string, PlaygroundConversation>;

	setInput: (contextId: string, value: string) => void;
	/**
	 * Sends a message in the given context. Writes results straight to the store
	 * so an in-flight reply still lands (and stays visible on return) even if the
	 * user navigates away from the Playground while it is processing.
	 */
	send: (contextId: string, client: Spectron, raw: string) => Promise<void>;
	/** Clears the conversation and closes the server-side session. */
	reset: (contextId: string) => void;
}

export const usePlaygroundStore = create<PlaygroundStore>()(
	immer((set, get) => ({
		conversations: {},

		setInput: (contextId, value) =>
			set((draft) => {
				if (!draft.conversations[contextId]) {
					draft.conversations[contextId] = emptyConversation();
				}
				draft.conversations[contextId].input = value;
			}),

		send: async (contextId, client, raw) => {
			const text = raw.trim();
			if (!text || get().conversations[contextId]?.busy) {
				return;
			}

			set((draft) => {
				if (!draft.conversations[contextId]) {
					draft.conversations[contextId] = emptyConversation();
				}
				const conv = draft.conversations[contextId];
				conv.input = "";
				// Only the newest message should fade in on render.
				for (const msg of conv.messages) {
					msg.fresh = false;
				}
				conv.messages.push({ id: crypto.randomUUID(), role: "user", content: text });
				conv.learned = null;
				conv.busy = true;
				conv.recalling = true;
			});

			try {
				// Lazily open a session on first send.
				let session = sessionHandles.get(contextId);
				if (!session) {
					session = await client.sessions.create({});
					sessionHandles.set(contextId, session);
				}
				const sessionId = session.id;

				// Recall (what the agent retrieves) + chat (the reply + what it
				// learns) run concurrently. Non-streaming chat is used so the
				// `memoryUpdates` payload — the whole point of the Learned panel —
				// is always populated.
				const recallPromise = client
					.recall(text, { k: 6, sessionId })
					.then((res) => {
						set((draft) => {
							const conv = draft.conversations[contextId];
							if (conv) {
								conv.recalled = res.hits;
							}
						});
					})
					.finally(() => {
						set((draft) => {
							const conv = draft.conversations[contextId];
							if (conv) {
								conv.recalling = false;
							}
						});
					});

				const chatPromise = client.chat(text, { sessionId });

				const [, res] = await Promise.all([recallPromise, chatPromise]);

				set((draft) => {
					const conv = draft.conversations[contextId];
					if (!conv) return;
					for (const msg of conv.messages) {
						msg.fresh = false;
					}
					conv.messages.push({
						id: crypto.randomUUID(),
						role: "assistant",
						content: res.reply,
						traceId: res.traceId,
						fresh: true,
					});
					conv.learned = res.memoryUpdates;
				});
			} catch (err) {
				showErrorNotification({ title: "Chat failed", content: err });
			} finally {
				set((draft) => {
					const conv = draft.conversations[contextId];
					if (conv) {
						conv.busy = false;
						conv.recalling = false;
					}
				});
			}
		},

		reset: (contextId) => {
			const previous = sessionHandles.get(contextId);
			sessionHandles.delete(contextId);
			// Best-effort server-side cleanup; ignore failures.
			previous?.close().catch(() => {});
			set((draft) => {
				draft.conversations[contextId] = emptyConversation();
			});
		},
	})),
);
