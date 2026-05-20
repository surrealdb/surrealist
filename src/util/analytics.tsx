import { adapter } from "~/adapter";
import { getUserSnapshot } from "~/providers/Auth";
import { getSetting } from "./config";
import { isProduction } from "./environment";
import { featureFlags } from "./feature-flags";

let incrementalId = 1;

export const HOSTNAME = "app.surrealdb.com";

const GA_SESSION_MS = 30 * 60 * 1000;

function generateGaCookieValue() {
	const randomNumber = Math.floor(Math.random() * 2147483647);
	const timestamp = Math.floor(Date.now() / 1000);
	const clientId = `${randomNumber}.${timestamp}`;
	return `GA1.1.${clientId}`;
}

function getCookie(name: string) {
	const nameEQ = `${name}=`;
	const ca = document.cookie.split(";");

	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) === " ") {
			c = c.substring(1, c.length);
		}

		if (c.indexOf(nameEQ) === 0) {
			return decodeURIComponent(c.substring(nameEQ.length, c.length));
		}
	}

	return null;
}

function setCookie(name: string, value: string, days: number) {
	let expires = "";
	if (days) {
		const date = new Date();
		date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
		expires = `; expires=${date.toUTCString()}`;
	}
	// biome-ignore lint/suspicious/noDocumentCookie: The Cookie Store API is not supported enough yet
	document.cookie = `${name}=${value || ""}${expires}; path=/`;
}

/**
 * Track analytics events
 */
export async function tagEvent(name: string, payload: Record<string, unknown> = {}) {
	if (!adapter.isTelemetryEnabled || !isProduction) {
		return;
	}

	let gaCookie = getCookie("_ga");

	if (!gaCookie) {
		gaCookie = generateGaCookieValue();
		setCookie("_ga", gaCookie, 365);
	}

	const gaParts = gaCookie.split(".");
	const clientId =
		gaParts[0] === "GA1" && gaParts.length >= 4
			? `${gaParts[gaParts.length - 2]}.${gaParts[gaParts.length - 1]}`
			: gaCookie;

	const { gtm_debug } = featureFlags.store;
	const debug_origin = getSetting("gtm", "origin");
	const debug_mode = getSetting("gtm", "debug_mode");
	const hostname = (gtm_debug && debug_origin) || HOSTNAME;
	const user = getUserSnapshot();

	const pageLocationKey = `${window.location.pathname}${window.location.search}`;
	const hitHrefKey = "__surrealist_ga_hit_path";
	const hitCountKey = "__surrealist_ga_hit_seq";

	let hitSeq = 1;

	try {
		const prevLocation = sessionStorage.getItem(hitHrefKey);

		if (prevLocation !== pageLocationKey) {
			sessionStorage.setItem(hitHrefKey, pageLocationKey);
			hitSeq = 1;
		} else {
			const prevN = sessionStorage.getItem(hitCountKey);
			const nextSeq = prevN ? Number.parseInt(prevN, 10) + 1 : 1;
			hitSeq = Number.isFinite(nextSeq) ? nextSeq : 1;
		}

		sessionStorage.setItem(hitCountKey, String(hitSeq));
	} catch {
		incrementalId += 1;
		hitSeq = incrementalId;
	}

	const sidStorageKey = "__surrealist_ga4_sid";

	let sessionIdStr = "";

	try {
		const nowMs = Date.now();
		const raw = sessionStorage.getItem(sidStorageKey);
		const parsed = raw ? (JSON.parse(raw) as { sid: string; last: number }) : null;

		if (parsed && nowMs - parsed.last < GA_SESSION_MS && parsed.sid) {
			sessionIdStr = parsed.sid;
		} else {
			sessionIdStr = String(Math.floor(nowMs / 1000));
		}

		sessionStorage.setItem(sidStorageKey, JSON.stringify({ sid: sessionIdStr, last: nowMs }));
	} catch {
		sessionIdStr = String(Math.floor(Date.now() / 1000));
	}

	const params = new URLSearchParams();

	params.append("v", "2");
	params.append("tid", import.meta.env.GTM_ID);
	params.append("cid", clientId);
	params.append("en", name);
	params.append("dl", window.location.href);
	params.append("dt", document.title);
	params.append("_s", String(hitSeq));
	params.append("sid", sessionIdStr);

	if (debug_mode) {
		params.append("debug_mode", "1");
	}

	if (user?.sub && user.sub.length > 0) {
		params.append("uid", user.sub);
	}

	const metadata: Record<string, unknown> = {
		...payload,
		surrealist_version: import.meta.env.VERSION,
		surrealist_platform: adapter.platform,
		surrealist_adapter: adapter.id,
		surrealist_mode: import.meta.env.MODE,
	};

	for (const [key, value] of Object.entries(metadata)) {
		if (value === undefined || value === null) {
			continue;
		}

		if (typeof value === "number" && Number.isFinite(value)) {
			params.append(`epn.${key}`, `${value}`);
		} else {
			params.append(`ep.${key}`, String(value));
		}
	}

	try {
		await adapter.trackEvent(`https://${hostname}/data/event/${btoa(params.toString())}`);
	} catch (err: unknown) {
		console.error("Failure", err);
	}
}
