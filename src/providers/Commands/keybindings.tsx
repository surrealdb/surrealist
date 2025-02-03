import { Text } from "@mantine/core";
import { capitalize } from "radash";
import { Fragment } from "react/jsx-runtime";
import { adapter } from "~/adapter";
import { Icon } from "~/components/Icon";
import {
	iconCommand,
	iconKeyboardOption,
	iconKeyboardControl,
	iconKeyboardShift,
} from "~/util/icons";

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
 * Translate a binding to Mantine format for use with useHotkeys
 */
export function translateBinding(binding: string[]) {
	return binding.map(expandModKey).join("+");
}

/**
 * Display a binding in human-readable format
 */
export function formatBinding(binding: string[]) {
	return binding.map(beautifyKey).map(capitalize).join(" + ");
}

/**
 * Display a binding as ReactNode
 */
export function displayBinding(binding: string[]) {
	return binding.map((part) => {
		return displayKey(expandMetaKey(expandModKey(part)));
	});
}

/**
 * Display a key as ReactNode
 */
export function displayKey(key: string) {
	switch (key) {
		case "command": {
			return (
				<Icon
					path={iconCommand}
					size={0.7}
				/>
			);
		}
		case "alt": {
			return (
				<Icon
					path={iconKeyboardOption}
					size={0.7}
				/>
			);
		}
		case "ctrl": {
			return (
				<Icon
					path={iconKeyboardControl}
					size={0.7}
				/>
			);
		}
		case "shift": {
			return (
				<Icon
					path={iconKeyboardShift}
					size={0.7}
				/>
			);
		}
		default: {
			return <Text fz="lg">{capitalize(beautifyKey(key))}</Text>;
		}
	}
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

	return adapter.platform === "darwin" ? "meta" : "ctrl";
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
