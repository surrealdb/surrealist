import { Group, Text } from "@mantine/core";
import { Stack } from "@mantine/core";
import { hideNotification, showNotification } from "@mantine/notifications";
import { Value } from "@surrealdb/ql-wasm";
import {
	DateArg,
	DurationUnit,
	formatRelative,
	startOfDay,
	startOfHour,
	startOfMinute,
} from "date-fns";
import escapeRegex from "escape-string-regexp";
import { uid } from "radash";
import { shake } from "radash";
import type { CSSProperties, FocusEvent, ReactNode, SyntheticEvent } from "react";
import { decodeCbor } from "surrealdb";
import { adapter } from "~/adapter";
import { Spacer } from "~/components/Spacer";
import type { Authentication, Protocol, Selectable } from "~/types";
import { openErrorModal } from "./errors";

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

export const DATE_TIME_FORMAT = "E MMM dd yyyy HH:mm";

export const EMAIL_REGEX = /^.+@.+$/;

export const CURRENCY_FORMAT = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	currencyDisplay: "narrowSymbol",
	maximumFractionDigits: 3,
});

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
export function showErrorNotification(info: { title: ReactNode; content: any }) {
	if (info.content instanceof Error) {
		showNotification({
			color: "red",
			autoClose: false,
			message: (
				<Group
					style={{
						cursor: "pointer",
					}}
					onClick={() => {
						openErrorModal(
							info.title,
							info.content.message,
							info.content.cause,
							info.content.stack,
						);
					}}
				>
					<Stack gap={0}>
						<Text
							fw={600}
							c="bright"
						>
							{info.title}
						</Text>
						<Text>Click here for more details</Text>
					</Stack>
					<Spacer />
				</Group>
			),
			onClick: (e) => {
				hideNotification(e.currentTarget.id);
			},
		});
	} else {
		showNotification({
			color: "red",
			title: info.title,
			message: info.content,
		});
	}
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
				<Text
					fw={600}
					c="bright"
				>
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
				<Text
					fw={600}
					c="bright"
				>
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
	return new Promise<T>((res, rej) => setTimeout(() => cb().then(res).catch(rej), timeout));
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
 * @param protocol The protocol
 * @param hostname The hostname
 * @param path The optional path to append
 * @returns The URI string
 */
export function connectionUri(protocol: Protocol, hostname: string, path?: string) {
	if (protocol === "mem") {
		return "mem://";
	}

	if (protocol === "indxdb") {
		return `indxdb://${hostname}`;
	}

	if (hostname === "") {
		return "";
	}

	const url = new URL(`${protocol}://${hostname}`);

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
 * Compute a unique name based on the given name and existing names
 *
 * @param baseName The base name
 * @param existing The list of existing names
 * @returns
 */
export function uniqueName(baseName: string, existing: string[]) {
	let tempName = "";
	let counter = 0;

	do {
		tempName = `${baseName} ${counter ? counter + 1 : ""}`.trim();
		counter++;
	} while (existing.includes(tempName));

	return tempName;
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
		const parsed = decodeCbor(Value.from_string(paramString).to_cbor().buffer);

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
 * A simplistic fuzzy match function which matches
 * the query against the target string. Allows passing
 * multiple queries separated by commas.
 *
 * @param query The query to match
 * @param target The target string
 * @returns Result
 */
export function fuzzyMultiMatch(query: string, target: string) {
	return query
		.split(",")
		.filter((q) => q.trim().length > 0)
		.some((q) => fuzzyMatch(q, target));
}

/**
 * Check if the current platform is mobile
 */
export function isMobile() {
	const userAgent = navigator.userAgent.toLowerCase();
	return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
}

/**
 * Returns whether the given event considers the mod key to be pressed
 *
 * @param event The event to check
 * @returns True if the mod key is pressed
 * @deprecated
 */
export function isModKey(event: Event) {
	if (event instanceof KeyboardEvent)
		return adapter.platform === "darwin" ? event.key === "Meta" : event.key === "Control";

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

/**
 * Returns if both numbers are approximately equal
 */
export function isEqualApprox(a: number, b: number) {
	return Math.abs(a - b) < 0.0001;
}

/**
 * Allow spreading optional values into an array
 *
 * @param value The optional value
 * @returns Array with the value or empty array
 */
export function optional<T>(value: T | T[] | false | undefined | null): T[] {
	return value ? (Array.isArray(value) ? value : [value]) : [];
}

/**
 * Throw the passed error as part of an expression
 */
export function __throw(error: Error | string): never {
	throw typeof error === "string" ? new Error(error) : error;
}

/**
 * Format the given memory amount in MB to a human readable string
 */
export function formatMemory(amountInMB: number, rounded = false) {
	const factor = rounded ? 1000 : 1024;

	if (amountInMB < factor) {
		return `${Number.parseFloat(amountInMB.toFixed(2))} MB`;
	}

	if (amountInMB < factor * factor) {
		return `${Number.parseFloat((amountInMB / factor).toFixed(2))} GB`;
	}

	return `${Number.parseFloat((amountInMB / (factor * factor)).toFixed(2))} TB`;
}

/**
 * Returns whether the given hostname is considered localhost
 */
export function isHostLocal(hostname: string) {
	return (
		hostname.startsWith("localhost") ||
		hostname.startsWith("127.") ||
		hostname.startsWith("::1")
	);
}

/**
 * Returns true when the two strings are similar, being case, whitespace, and diacritic insensitive
 */
export function isSimilar(a: string, b: string) {
	const left = a.normalize("NFD").replace(/[\u0300-\u036f\s]/g, "");
	const right = b.normalize("NFD").replace(/[\u0300-\u036f\s]/g, "");

	return left.toLowerCase() === right.toLowerCase();
}

/**
 * Pluralize the given word based on the count
 */
export function plural(count: number, singular: string, plural = `${singular}s`) {
	return count === 1 ? singular : plural;
}

/**
 * Compile a static list of strings into a selectable list
 */
export function selectable(values: string[]): Selectable[] {
	return values.map((value) => ({ value, label: value }));
}

/**
 * Optionally append search parameters to the given URL
 */
export function withSearchParams(
	url: string,
	params: Record<string, string | undefined> | URLSearchParams,
) {
	const search = params instanceof URLSearchParams ? params : new URLSearchParams(shake(params));
	const value = search.toString();

	if (value) {
		return `${url}?${value}`;
	}

	return url;
}

/**
 * Format the given date as a relative date
 *
 * @param date The date to format
 * @returns The formatted date
 */
export function formatRelativeDate(date: number): string {
	return (
		formatRelative(date, new Date()).charAt(0).toUpperCase() +
		formatRelative(date, new Date()).slice(1)
	);
}

/**
 * Returns the start of the given date at the specified resolution.
 */
export function startOfDate(date: DateArg<Date>, resolution: DurationUnit): Date {
	switch (resolution) {
		case "minutes":
			return startOfMinute(date);
		case "hours":
			return startOfHour(date);
		case "days":
			return startOfDay(date);
		default:
			throw new Error(`Unsupported resolution: ${resolution}`);
	}
}
