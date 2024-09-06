import { Text } from "@mantine/core";
import { Stack } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { Value } from "@surrealdb/ql-wasm";
import escapeRegex from "escape-string-regexp";
import { uid } from "radash";
import type {
	CSSProperties,
	FocusEvent,
	ReactNode,
	SyntheticEvent,
} from "react";
import { decodeCbor, escape_ident } from "surrealdb";
import { adapter } from "~/adapter";
import type { Authentication, TabQuery } from "~/types";

const VARIABLE_PATTERN = /\$\w+/gi;
const RESERVED_VARIABLES = new Set([
	"auth",
	"token",
	"scope",
	"session",
	"before",
	"after",
	"value",
	"input",
	"this",
	"parent",
	"event",
]);

export const TRUNCATE_STYLE: CSSProperties = {
	whiteSpace: "nowrap",
	overflow: "hidden",
	textOverflow: "ellipsis",
};

export const Y_SLIDE_TRANSITION = {
	in: { opacity: 1, transform: "translateY(0)" },
	out: { opacity: 0, transform: "translateY(-20px)" },
	common: { transformOrigin: "top" },
	transitionProperty: "transform, opacity",
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
 * Display an error notification
 *
 * @param title The title message
 * @param subtitle The subtitle message
 */
export function showError(info: { title: ReactNode; subtitle: ReactNode }) {
	showNotification({
		color: "pink.9",
		message: (
			<Stack gap={0}>
				<Text fw={600} c="bright">
					{info.title}
				</Text>
				<Text>{info.subtitle}</Text>
			</Stack>
		),
	});
}

/**
 * Display a warning notification
 *
 * @param title The title message
 * @param subtitle The subtitle message
 */
export function showWarning(info: { title: ReactNode; subtitle: ReactNode }) {
	showNotification({
		color: "orange",
		message: (
			<Stack gap={0}>
				<Text fw={600} c="bright">
					{info.title}
				</Text>
				<Text>{info.subtitle}</Text>
			</Stack>
		),
	});
}

/**
 * Display an informative notification
 *
 * @param title The title message
 * @param subtitle The subtitle message
 */
export function showInfo(info: { title: ReactNode; subtitle: ReactNode }) {
	showNotification({
		color: "surreal.6",
		message: (
			<Stack gap={0}>
				<Text fw={600} c="bright">
					{info.title}
				</Text>
				<Text>{info.subtitle}</Text>
			</Stack>
		),
	});
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
 * Simplify the given field kind
 *
 * @param value The input kind string
 * @returns The simplified kind
 */
export function simplifyKind(kind: string) {
	const bracket = kind.indexOf("<");

	if (bracket === -1) {
		return kind;
	}

	return kind.slice(0, bracket);
}

/**
 * Create a new unique id
 */
export function newId() {
	return uid(9);
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
		setTimeout(() => cb().then(res).catch(rej), timeout),
	);
}
/**
 * Returns whether the result is a permission error
 *
 * @param result The result to check
 * @returns True if the result is a permission error
 */
export function isPermissionError(result: any) {
	return (
		typeof result === "string" &&
		result.includes("Not enough permissions to perform this action")
	);
}

/**
 * Convert the given connection options to a connection uri
 *
 * @param options The connection options
 * @param path The optional path to append
 * @returns The URI string
 */
export function connectionUri(options: Authentication, path?: string) {
	if (options.protocol === "mem") {
		return "mem://";
	}

	if (options.protocol === "indxdb") {
		return `indxdb://${options.hostname}`;
	}

	const url = new URL(`${options.protocol}://${options.hostname}`);

	// Optionally trim existing rpc
	if (url.pathname.endsWith("rpc")) {
		url.pathname = url.pathname.slice(0, -3);
	}

	// Append slash if missing
	if (!url.pathname.endsWith("/")) {
		url.pathname += "/";
	}

	// Append rpc
	url.pathname += path ?? "rpc";

	return url.toString();
}

/**
 * Convert the given connection options to a version uri
 *
 * @param options The connection options
 * @returns The URI string
 */
export function versionUri(options: Authentication) {
	if (options.protocol === "mem" || options.protocol === "indxdb") {
		return undefined;
	}

	const protocol = options.protocol.replace(/^ws/, "http");
	const url = new URL(`${protocol}://${options.hostname}`);

	// Optionally trim existing rpc
	if (url.pathname.endsWith("rpc")) {
		url.pathname = url.pathname.slice(0, -3);
	}

	// Append slash if missing
	if (!url.pathname.endsWith("/")) {
		url.pathname += "/";
	}

	// Append version
	url.pathname += "version";

	return url.toString();
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
	return name.includes(".") ? name.slice(0, name.lastIndexOf(".")) : name;
}

/**
 * Returns whether the given tab has not been renamed
 * from its default name.
 *
 * @param tab The tab to check
 * @returns True if the tab is unnamed
 */
export function isUnnamedTab(tab: TabQuery) {
	return !!tab.name?.startsWith("New query");
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
		const parsed = decodeCbor(
			Value.from_string(paramString).to_cbor().buffer,
		);

		if (typeof parsed !== "object" || Array.isArray(parsed)) {
			throw new TypeError("Must be object");
		}

		params = parsed;
	} catch {
		adapter.warn("Params", "Invalid JSON in variables");
	}

	return params;
}

/**
 * Correctly escape a string for use as table name
 *
 * @param value The value to escape
 * @returns The escaped value
 * @deprecated Use `escapeIdent` from surrealql.tsx instead
 */
export function tb(value: string) {
	return escape_ident(value);
}

/**
 * Parse the JWT payload from the given token
 * without checking for validity. This should
 * never be used in a secure context and only
 * for display purposes.
 *
 * @param token The JWT token
 * @returns Parsed payload
 */
export function fastParseJwt(token: string) {
	try {
		const parts = token.split(".");

		if (parts.length !== 3) {
			return null;
		}

		return JSON.parse(atob(parts[1]));
	} catch {
		return null;
	}
}

/**
 * A simplistic fuzzy match function which matches
 * the query against the target string
 *
 * @param query The query to match
 * @param target The target string
 * @returns Result
 */
export function fuzzyMatch(query: string, target: string) {
	const pattern = query
		.split(" ")
		.map((q) => escapeRegex(q))
		.join(".*?");
	const regex = new RegExp(pattern, "i");

	return regex.test(target);
}

/**
 * Check if the current platform is mobile
 */
export function isMobile() {
	const userAgent = navigator.userAgent.toLowerCase();
	return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(
		userAgent,
	);
}

/**
 * Extract a list of variables from the given query
 *
 * @param query The query to extract from
 * @returns The list of variables
 */
export function extractVariables(query: string): string[] {
	const matches = query.match(VARIABLE_PATTERN) || [];

	return matches
		.map((v) => v.slice(1))
		.filter((v) => !RESERVED_VARIABLES.has(v));
}

/**
 * Returns whether the given event considers the mod key to be pressed
 *
 * @param event The event to check
 * @returns True if the mod key is pressed
 */
export function isModKey(event: Event) {
	if (event instanceof KeyboardEvent)
		return adapter.platform === "darwin"
			? event.key === "Meta"
			: event.key === "Control";

	if (event instanceof MouseEvent)
		return adapter.platform === "darwin" ? event.metaKey : event.ctrlKey;

	return false;
}

/**
 * Slugify the given string for use in URLs and file names
 *
 * @param text The text to slugify
 * @returns The slugified text
 */
export function slugify(text: string) {
	return text
		.normalize("NFD")
		.replaceAll(/[\u0300-\u036F]/g, "")
		.toLowerCase()
		.replaceAll(/\s+/g, "-")
		.replaceAll(/[^\da-z-]/g, "")
		.replaceAll(/-+/g, "-")
		.replaceAll(/^-+|-+$/g, "");
}
