import type { ViewPage } from "~/types";
import { IntentEvent, NavigateViewEvent } from "./global-events";

const INTENT_REGISTRY = {
	"open-command-palette": null,
	"open-connection": null,
	"open-connections": null,
	"open-documentation": null,
	"open-help": null,
	"open-news": null,
	"open-changelog": null,
	"open-settings": null,
	"open-embedder": null,
	"open-desktop-download": null,
	"open-sidekick": null,
	"close-sidekick": null,
	"new-connection": null,
	"new-table": null,
	"toggle-serving": null,
	"open-serving-console": null,
	"increase-window-scale": null,
	"decrease-window-scale": null,
	"increase-editor-scale": null,
	"decrease-editor-scale": null,
	"toggle-pinned": null,
	"highlight-tool": null,
	"import-database": null,
	"export-database": null,
	"cloud-auth": null,
	"cloud-signin": null,
	"cloud-signout": null,
	"cloud-activate": null,
	"new-query": "query",
	"close-query": "query",
	"run-query": "query",
	"save-query": "query",
	"open-query-file": "query",
	"format-query": "query",
	"toggle-variables": "query",
	"infer-variables": "query",
	"open-saved-queries": "query",
	"open-query-history": "query",
	"explore-table": "explorer",
	"run-graphql-query": "graphql",
	"format-graphql-query": "graphql",
	"toggle-graphql-variables": "graphql",
	"infer-graphql-variables": "graphql",
	"design-table": "designer",
	"focus-table": "designer",
	"create-user": "authentication",
	"create-access": "authentication",
	"register-user": "authentication",
	"docs-switch-language": "documentation",
} satisfies IntentMap;

export type IntentType = keyof typeof INTENT_REGISTRY;
export type IntentPayload = Record<string, string>;
export type IntentMap = Record<string, ViewPage | null>;

export interface Intent<T extends IntentType> {
	type: T;
	payload?: IntentPayload;
}

/**
 * Returns whether the given type is a valid intent
 */
export function isIntent(type: string): type is IntentType {
	return Object.keys(INTENT_REGISTRY).includes(type);
}

/**
 * Returns the view applicable to a given intent type
 */
export function getIntentView(type: IntentType) {
	return INTENT_REGISTRY[type];
}

/**
 * Process an intent URL with support for view paths
 */
export function handleIntentRequest(intentStr: string) {
	const [type, ...args] = intentStr.split(":");

	if (isIntent(type)) {
		const payload = (args.join(":") || "").split(",").reduce((acc, arg) => {
			const [key, value] = arg.split("=");
			acc[key] = value;
			return acc;
		}, {} as any);

		dispatchIntent(type, payload);
	}
}

const INTENT_BUFFER: Intent<IntentType>[] = [];

/**
 * Dispatch an intent with the specified payload
 *
 * @param intent The intent type to dispatch
 * @param payload Optional payload
 */
export function dispatchIntent(intent: IntentType, payload?: IntentPayload) {
	const view = getIntentView(intent);

	INTENT_BUFFER.push({ type: intent, payload });

	if (view) {
		NavigateViewEvent.dispatch(view);
	}

	IntentEvent.dispatch(null);
}

/**
 * Consume the next intent of the specified type
 */
export function consumeIntent(type: IntentType) {
	const index = INTENT_BUFFER.findIndex((intent) => intent.type === type);

	if (index !== -1) {
		const [intent] = INTENT_BUFFER.splice(index, 1);
		return intent;
	}

	return null;
}
