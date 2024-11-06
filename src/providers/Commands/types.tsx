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
	/** The unique id of the command */
	id: string;
	/** The display name of the command */
	name: string;
	/** The icon used to represent the command */
	icon: string;
	/** Truthy when bindable, optionally holding a default bind */
	binding?: boolean | string[];
	/** The action to trigger */
	action: Action;
	/** Aliases used for searching */
	aliases?: string[];
	/** Whether the command is hidden from the palette */
	unlisted?: boolean;
	/** Whether activation is disabled */
	disabled?: boolean;
}

export interface CommandCategory {
	name: string;
	visibility?: CategoryVisibility;
	commands: Command[];
}
