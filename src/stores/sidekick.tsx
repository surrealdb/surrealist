import { RecordId } from "surrealdb";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { chatOf, messageOf } from "~/components/Sidekick/helpers";
import { StreamEvent } from "~/components/Sidekick/types";
import type { SidekickChat, SidekickChatMessage } from "~/types";

export interface SidekickChatWithHistory extends SidekickChat {
	history: SidekickChatMessage[];
}

export type SidekickStore = {
	activeId: RecordId | null;
	activeHistory: SidekickChatMessage[];
	activeTitle: string;
	activeRequest: SidekickChatMessage | null;
	activeResponse: SidekickChatMessage | null;
	thinkingText: string;

	resetChat: () => void;
	restoreChat: (chat: SidekickChatWithHistory) => void;
	startRequest: (message: string) => void;
	applyEvent: (event: StreamEvent) => void;
	completeRequest: () => void;
};

export const useSidekickStore = create<SidekickStore>()(
	immer((set) => ({
		activeId: null,
		activeHistory: [],
		activeTitle: "",
		activeRequest: null,
		activeResponse: null,
		thinkingText: "",

		resetChat: () =>
			set({
				activeId: null,
				activeHistory: [],
				activeTitle: "",
				activeRequest: null,
				activeResponse: null,
				thinkingText: "",
			}),

		restoreChat: (chat) =>
			set({
				activeId: chat.id,
				activeHistory: chat.history,
				activeTitle: chat.title,
				activeRequest: null,
				activeResponse: null,
				thinkingText: "",
			}),

		startRequest: (message) =>
			set((draft) => {
				draft.thinkingText = "";
				draft.activeRequest = {
					id: null,
					content: message,
					role: "user",
					sent_at: new Date(),
				};
			}),

		applyEvent: (event) =>
			set((draft) => {
				switch (event.type) {
					case "start": {
						draft.activeId = chatOf(event.data.id);
						draft.activeRequest = {
							id: messageOf(event.data.request.id),
							content: event.data.request.content,
							role: "user",
							sent_at: new Date(),
						};
						draft.activeResponse = {
							id: messageOf(event.data.response.id),
							content: event.data.response.content,
							role: "assistant",
							sent_at: new Date(),
						};
						break;
					}
					case "sources": {
						if (!draft.activeResponse) return;
						draft.activeResponse.sources = event.data;
						break;
					}
					case "title": {
						draft.activeTitle = event.data;
						break;
					}
					case "thinking": {
						draft.thinkingText = event.data;
						break;
					}
					case "response": {
						if (!draft.activeResponse) return;
						if (event.data.complete) {
							draft.activeResponse.content = event.data.content;
						} else {
							draft.activeResponse.content += event.data.content;
						}
						break;
					}
				}
			}),

		completeRequest: () =>
			set((draft) => {
				if (draft.activeRequest) {
					draft.activeHistory.push(draft.activeRequest);
				}

				if (draft.activeResponse) {
					draft.activeHistory.push(draft.activeResponse);
				}

				draft.activeRequest = null;
				draft.activeResponse = null;
				draft.thinkingText = "";
			}),
	})),
);
