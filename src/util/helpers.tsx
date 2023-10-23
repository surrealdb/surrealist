import { Text } from "@mantine/core";
import { Stack } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { uid } from "radash";
import { CSSProperties } from "react";
import { adapter } from "~/adapter";
import { VIEW_MODES } from "~/constants";
import { store } from "~/store";
import { getActiveSession } from "./environments";
import { setNativeTheme } from "~/stores/interface";
import { ViewMode } from "~/types";

export const TRUNCATE_STYLE: CSSProperties = {
	whiteSpace: "nowrap",
	overflow: "hidden",
	textOverflow: "ellipsis",
};

export function updateTitle() {
	const { config } = store.getState();
	const { pathname } = window.location;

	const activeView = pathname.split("/")[1] as ViewMode;
	const session = getActiveSession();
	const viewInfo = VIEW_MODES.find((v) => v.id === activeView);
	const segments: string[] = [];

	if (session) {
		segments.push(`${session.name} -`);
	}

	segments.push(`Surrealist ${viewInfo?.name}`);

	if (config.isPinned) {
		segments.push('(Pinned)');
	}

	adapter.setWindowTitle(segments.join(' '));
}

/**
 * Watch for changes to the native theme
 */
export function watchNativeTheme() {
	const mediaMatch = window.matchMedia("(prefers-color-scheme: dark)");

	store.dispatch(setNativeTheme(mediaMatch.matches ? "dark" : "light"));

	mediaMatch.addEventListener("change", (event) => {
		store.dispatch(setNativeTheme(event.matches ? "dark" : "light"));
	});
}

/**
 * Display an error notification
 *
 * @param title The title message
 * @param subtitle The subtitle message
 */
export function showError(title: string, subtitle: string) {
	showNotification({
		color: "red.6",
		message: (
			<Stack spacing={0}>
				<Text weight={600}>{title}</Text>
				<Text color="light.5">{subtitle}</Text>
			</Stack>
		),
	});
}

/**
 * Print a log message to the console
 *
 * @param label The label to use
 * @param color The color to use
 * @param message The message to print
 */
export function printLog(label: string, color: string, ...message: any[]) {
	console.log(`%c${label}:`, `color: ${color}; font-weight: bold`, ...message);
}

/**
 * Returns the mod of the given numbers, even if the result is negative
 *
 * @param n The number to mod
 * @param m The mod
 */
export function mod(n: number, m: number) {
	return ((n % m) + m) % m;
}

/**
 * Extracts items out of the syntax `prefix(item1, item2, item3)`
 *
 * @param value The input string
 * @param prefix The prefix to trim
 * @returns The list of items
 */
export function extractTypeList(input: string, prefix: string) {
	return input
		.replace(`${prefix}<`, "")
		.replace(">", "")
		.split("|")
		.map((t) => t.trim());
}

/**
 * Create a new unique id
 */
export function newId() {
	return uid(5);
}

/**
 * A function which orders each element in items present in order by
 * the order of the elements in order
 *
 * @param items The items to order
 * @param order The order to apply
 */
export function applyOrder<T>(items: T[], order: T[]) {
	let index = 0;

	return items.map((item) => {
		if (order.includes(item)) {
			return order[index++];
		}

		return item;
	});
}
