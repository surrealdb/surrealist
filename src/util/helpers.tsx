import { Text } from "@mantine/core";
import { Stack } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { uid } from "radash";
import { CSSProperties, FocusEvent, SyntheticEvent } from "react";
import { adapter } from "~/adapter";
import { VIEW_MODES } from "~/constants";
import { getConnection } from "./connection";
import { ConnectionOptions, TabQuery, ViewMode } from "~/types";
import { useInterfaceStore } from "~/stores/interface";
import { getSetting } from "./config";

const FIELD_KIND_PATTERN = /^(\w+)<?(.*?)>?$/;

export const TRUNCATE_STYLE: CSSProperties = {
	whiteSpace: "nowrap",
	overflow: "hidden",
	textOverflow: "ellipsis",
};

export const ON_STOP_PROPAGATION = (e: SyntheticEvent<any>) => {
	e.stopPropagation();
};

export const ON_FOCUS_SELECT = (e: FocusEvent<HTMLElement>) => {
	if (e.target instanceof HTMLInputElement) {
		e.target.select();
	} else {
		const text = e.target.childNodes[0] as Text;
		const range = document.createRange();

		range.selectNode(text);
		window.getSelection()?.removeAllRanges();
		window.getSelection()?.addRange(range);
	}
};

/**
 * Update the title of the window
 */
export function updateTitle() {
	const { pathname } = window.location;

	const windowPinned = getSetting("behavior", "windowPinned");
	const activeView = pathname.split("/")[1] as ViewMode;
	const session = getConnection();
	const viewInfo = VIEW_MODES.find((v) => v.id === activeView);
	const segments: string[] = [];

	if (session) {
		segments.push(`${session.name} -`);
	}

	segments.push(`Surrealist ${viewInfo?.name || ''}`);

	if (windowPinned) {
		segments.push('(Pinned)');
	}

	const title = segments.join(' ');

	adapter.setWindowTitle(title);
	useInterfaceStore.getState().setWindowTitle(title);

	console.log(title);
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
			<Stack gap={0}>
				<Text fw={600}>{title}</Text>
				<Text c="slate">{subtitle}</Text>
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
 * @deprecated Use `extractType` instead
 */
export function extractTypeList(input: string, prefix: string) {
	return input
		.replace(`${prefix}<`, "")
		.replace(">", "")
		.split("|")
		.map((t) => t.trim());
}

/**
 * Extracts the kind and items out of a field kind
 *
 * @param value The input string
 * @returns The sanitized kind and items list
 */
export function extractType(input: string): [string, string[]] {
	const [, kind, items] = FIELD_KIND_PATTERN.exec(input) || [];

	return items.trim().length > 0
		? [kind, items.split("|").map((t) => t.trim())]
		: [kind, []];
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

/**
 * Wrap a promise in a timeout
 *
 * @param cb The callback providing the promise
 * @param timeout The timeout in milliseconds
 * @returns The promise
 */
export function timeout<T>(cb: () => Promise<T>, timeout = 1000) {
	return new Promise<T>((res, rej) =>
		setTimeout(() => cb().then(res).catch(rej), timeout)
	);
}
/**
 * Returns whether the result is a permission error
 *
 * @param result The result to check
 * @returns True if the result is a permission error
 */
export function isPermissionError(result: any) {
	return typeof result === 'string' && result.includes('Not enough permissions to perform this action');
}

/**
 * Convert the given connection options to a connection uri
 *
 * @param options The connection options
 * @returns The URI string
 */
export function connectionUri(options: ConnectionOptions) {
	if (options.protocol == "mem") {
		return `${options.protocol}://`;
	}

	return `${options.protocol}://${options.hostname}`;
}

/**
 * Clamp a value between a min and max
 *
 * @param value The value to clamp
 * @param min The minimum value
 * @param max The maximum value
 * @returns The clamped value
 */
export function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

/**
 * Returns the file name without the extension
 *
 * @param name The file name
 * @returns The file name without the extension
 */
export function getFileName(name: string) {
	return name.includes('.')
		? name.slice(0, name.lastIndexOf('.'))
		: name;
}

/**
 * Returns whether the given tab has not been renamed
 * from its default name.
 *
 * @param tab The tab to check
 * @returns True if the tab is unnamed
 */
export function isUnnamedTab(tab: TabQuery) {
	return !!tab.name?.startsWith('New query');
}

/**
 * Attempt to parse the given string as a valid params object
 * while silently handling any errors
 *
 * @param paramString The string to parse
 * @returns The parsed params object
 */
export function tryParseParams(paramString: string) {
	let params: any = {};

	try {
		const parsed = JSON.parse(paramString);

		if (typeof parsed !== "object" || Array.isArray(parsed)) {
			throw new TypeError("Must be object");
		}

		params = parsed;
	} catch {
		console.warn("Invalid JSON in variables");
	}

	return params;
}

/**
 * Correctly escape a string for use as table name
 *
 * @param value The value to escape
 * @returns The escaped value
 */
export function tb(value: string) {
	return `\`${value}\``;
}