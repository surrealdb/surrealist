import {
	iconAccount,
	iconCreditCard,
	iconDownload,
	iconHistory,
	iconLive,
	iconPlus,
	iconQuery,
	iconRelation,
	iconReset,
	iconStar,
	iconTable,
	iconTransfer,
} from "@surrealdb/ui";
import { RecordId } from "surrealdb";
import { SidekickChat } from "~/types";
import { GroupedChats } from "./types";

export const SIDEKICK_QUESTIONS = [
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

export function chatOf(id: string) {
	return new RecordId("sidekick_chat", id);
}

export function messageOf(id: string) {
	return new RecordId("sidekick_message", id);
}

export function groupChatsByDate(chats: SidekickChat[]): GroupedChats {
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
	const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
	const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

	const grouped: GroupedChats = {
		today: [],
		yesterday: [],
		pastWeek: [],
		pastMonth: [],
		older: [],
	};

	chats.forEach((chat) => {
		const chatDate = new Date(chat.last_activity);
		const chatDay = new Date(chatDate.getFullYear(), chatDate.getMonth(), chatDate.getDate());

		if (chatDay.getTime() === today.getTime()) {
			grouped.today.push(chat);
		} else if (chatDay.getTime() === yesterday.getTime()) {
			grouped.yesterday.push(chat);
		} else if (chatDay >= weekAgo) {
			grouped.pastWeek.push(chat);
		} else if (chatDay >= monthAgo) {
			grouped.pastMonth.push(chat);
		} else {
			grouped.older.push(chat);
		}
	});

	return grouped;
}
