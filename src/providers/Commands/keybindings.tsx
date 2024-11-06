import { capitalize } from "radash";
import { adapter } from "~/adapter";

const MODIFIER_KEYS = ["shift", "alt", "meta", "mod", "ctrl"];

const SANITIZE_MAP: Record<string, string> = {
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
 * Sanitized keys with similar meaning into a single key
 */
export function sanitizeKey(key: string): string {
	return (SANITIZE_MAP[key] ?? key ?? "").trim().toLowerCase().replace(/key/, "");
}

/**
 * Prepare a key for display in human-readable format
 */
export function beautifyKey(key: string) {
	return expandMetaKey(expandModKey(key)).replace(/digit|numpad|arrow/i, "");
}

/**
 * Display a binding in human-readable format
 */
export function displayBinding(binding: string[]) {
	return binding.map(beautifyKey).map(capitalize).join(" + ");
}

/**
 * Translate a binding to Mantine format for use with useHotkeys
 */
export function translateBinding(binding: string[]) {
	return binding.map(expandModKey).join("+");
}

/**
 * Expand the mod key into platform-specific naming. This function should
 * be called before expandMetaKey to ensure that the mod key is optionally
 * expanded into meta.
 */
export function expandModKey(key: string) {
	if (key !== "mod") {
		return key;
	}

	return adapter.platform === "windows" ? "ctrl" : "meta";
}

/**
 * Expand the meta key into platform-specific naming. This function should
 * be called after expandModKey to ensure that previously expanded meta
 * keys are correctly named.
 */
export function expandMetaKey(key: string) {
	if (key !== "meta") {
		return key;
	}

	return adapter.platform === "windows"
		? "win"
		: adapter.platform === "darwin"
			? "command"
			: "meta";
}
