export const INTENTS = {
	'new-connection': [],
	'new-table': ['type'],
	'open-settings': ['tab'],
	'open-connections': [],
	'open-help': [],
} as const;

export type IntentType = keyof typeof INTENTS;
export type IntentPayload = Record<string, string>;

export interface Intent<T extends IntentType> {
	type: T;
	payload?: IntentPayload;
}

export function isIntent(type: string): type is IntentType {
	return Object.keys(INTENTS).includes(type);
}