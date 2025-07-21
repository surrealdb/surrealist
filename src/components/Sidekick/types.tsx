import { RecordId } from "surrealdb";

export type Sources = {
	header: string;
	links: { url: string; title: string; img_url: string }[];
};

export type StreamResponse =
	| { type: "error"; data: string }
	| { type: "failure"; data: string }
	| {
			type: "start";
			data: {
				id: string;
				request: { id: string; content: string };
				response: { id: string; content: string };
			};
	  }
	| { type: "response"; data: { content: string; complete: boolean } }
	| { type: "sources"; data: Sources }
	| { type: "thinking"; data: string }
	| { type: "title"; data: string }
	| { type: "complete" };

export interface ActiveMessage {
	role: "user" | "assistant";
	content: string;
	sources?: Sources;
}

export interface ActiveChat {
	id: RecordId | null;
	title: string;
	messages: ActiveMessage[];
}

export interface ChatConversationProps {
	activeChat: ActiveChat;
	setActiveChat: (chat: ActiveChat) => void;
	isAuthed: boolean;
}

export interface ChatMessageProps {
	message: ActiveMessage;
	profile: any;
	isResponding: boolean;
}
