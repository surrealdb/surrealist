import { capitalize } from "radash";
import { adapter } from "~/adapter";

const MODIFIER_KEYS = ["shift", "alt", "meta", "mod", "ctrl"];

const SIMPLIFY_MAP: Record<string, string> = {
	esc: "escape",
	return: "enter",
	ShiftLeft: "shift",
	ShiftRight: "shift",
	AltLeft: "alt",
	AltRight: "alt",
	MetaLeft: "meta",
	MetaRight: "meta",
	OSLeft: "meta",
	OSRight: "meta",
	ControlLeft: "ctrl",
	ControlRight: "ctrl",
};

/**
 * Returns true if key is a modifier key
 */
export function isModifierKey(key: string) {
	return MODIFIER_KEYS.includes(key);
}

/**
 * Maps key to simplified version
 */
export function simplifyKey(key?: string): string {
	return ((key && SIMPLIFY_MAP[key]) || key || "")
		.trim()
		.toLowerCase()
		.replace(/key|digit|numpad|arrow/, "");
}

/**
 * Display a binding in human-readable format
 */
export function displayBinding(binding: string[]) {
	return binding.map(renameKey).map(capitalize).join(" + ");
}

/**
 * Translate a binding to Mantine format for use with useHotkeys
 */
export function translateBinding(binding: string[]) {
	return binding.join("+");
}

/**
 * Perform environment-specific key renaming
 */
export function renameKey(key: string) {
	switch (key) {
		case "meta":
			return adapter.platform === "windows"
				? "win"
				: adapter.platform === "darwin"
					? "command"
					: "meta";
		case "mod":
			return adapter.platform === "windows" ? "ctrl" : "command";
		default:
			return key;
	}
}
