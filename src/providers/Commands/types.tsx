import type { IntentPayload, IntentType } from "~/util/intents";
import type { PreferenceController } from "~/util/preferences";

type LaunchAction = { type: "launch"; handler: () => void };
type InsertAction = { type: "insert"; content: string };
type HrefAction = { type: "href"; href: string };
type PreferenceAction = { type: "preference"; controller: PreferenceController };
type IntentAction = {
	type: "intent";
	intent: IntentType;
	payload?: IntentPayload;
};

type Action = LaunchAction | InsertAction | HrefAction | IntentAction | PreferenceAction;
type CategoryVisibility = "always" | "searched" | "unsearched";

export interface Command {
	id: string;
	name: string;
	icon: string;
	binding?: boolean | string[];
	action: Action;
	aliases?: string[];
	disabled?: boolean;
}

export interface CommandCategory {
	name: string;
	visibility?: CategoryVisibility;
	commands: Command[];
}
