import { dispatchIntent } from "~/hooks/url";
import { ViewMode } from "~/types";

const INTENT_REGISTRY = {
	'open-command-palette': null,
	'open-connections': null,
	'open-help': null,
	'open-news': null,
	'open-changelog': null,
	'open-settings': null,
	'open-embedder': null,
	'open-desktop-download': null,
	'open-keymap': null,
	'new-connection': null,
	'new-table': null,
	'toggle-serving': null,
	'open-serving-console': null,
	'increase-window-scale': null,
	'decrease-window-scale': null,
	'increase-editor-scale': null,
	'decrease-editor-scale': null,
	'toggle-pinned': null,
	'highlight-tool': null,
	'new-query': 'query',
	'run-query': 'query',
	'save-query': 'query',
	'format-query': 'query',
	'toggle-variables': 'query',
	'infer-variables': 'query',
	'open-saved-queries': 'query',
	'open-query-history': 'query',
	'explore-table': 'explorer',
	'import-database': 'explorer',
	'export-database': 'explorer',
	'run-graphql-query': 'graphql',
	'format-graphql-query': 'graphql',
	'toggle-graphql-variables': 'graphql',
	'infer-graphql-variables': 'graphql',
	'design-table': 'designer',
	'create-user': 'authentication',
	'create-scope': 'authentication',
	'register-user': 'authentication',
	'docs-switch-language': 'documentation',
	'cloud-callback': 'cloud',
} satisfies IntentMap;

export type IntentType = keyof typeof INTENT_REGISTRY;
export type IntentPayload = Record<string, string>;
export type IntentMap = Record<string, ViewMode | null>;

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
	const [type, ...args] = intentStr.split(':');

	if (isIntent(type)) {
		const payload = (args.join(':') || '').split(',').reduce((acc, arg) => {
			const [key, value] = arg.split('=');
			return { ...acc, [key]: value };
		}, {} as any);

		dispatchIntent(type, payload);
	}
}
