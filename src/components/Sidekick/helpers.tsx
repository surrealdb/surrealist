import { RecordId } from "surrealdb";
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
} from "~/util/icons";

export const NEW_CHAT = chatOf("__new__");
export const NEW_MESSAGE = messageOf("__new__");

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
