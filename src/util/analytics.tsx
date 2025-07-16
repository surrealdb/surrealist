import { adapter } from "~/adapter";
import { useCloudStore } from "~/stores/cloud";
import { getSetting } from "./config";
import { isPreview, isProduction } from "./environment";
import { featureFlags } from "./feature-flags";

let incrementalId = 1;

export const HOSTNAME = isProduction
	? "app.surrealdb.com"
	: isPreview
		? "beta-app.surrealdb.com"
		: "dev-app.surrealdb.com";

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
	document.cookie = `${name}=${value || ""}${expires}; path=/`;
}

/**
 * Track analytics events
 */
export async function tagEvent(name: string, payload: Record<string, unknown> = {}) {
	if (!adapter.isTelemetryEnabled || !isProduction) {
		return;
	}

	let _ga = getCookie("_ga");

	if (!_ga) {
		_ga = generateGaCookieValue();
		setCookie("_ga", _ga, 365);
	}

	const { gtm_debug } = featureFlags.store;
	const debug_origin = getSetting("gtm", "origin");
	const debug_mode = getSetting("gtm", "debug_mode");
	const hostname = (gtm_debug && debug_origin) || HOSTNAME;
	const uniqueId = (incrementalId++).toString();
	const params = new URLSearchParams();
	const { profile, userId } = useCloudStore.getState();

	_ga = _ga.substring(6);

	params.append("v", "2");
	params.append("tid", import.meta.env.GTM_ID);
	params.append("cid", _ga);
	params.append("en", name);
	params.append("dl", window.location.href);
	params.append("dt", document.title);
	params.append("_s", uniqueId);

	if (debug_mode) {
		params.append("debug_mode", "1");
	}

	params.append("ep.surrealist_version", import.meta.env.VERSION);
	params.append("ep.surrealist_platform", adapter.platform);
	params.append("ep.surrealist_adapter", adapter.id);
	params.append("ep.surrealist_mode", import.meta.env.MODE);

	for (const [key, value] of Object.entries(payload)) {
		params.append(`epn.${key}`, `${value}`);
	}

	if (userId) {
		params.append("ep.aid", userId);
	}

	if (name === "cloud_signin" || name === "cloud_signout") {
		params.append("ep.email", profile.username);
	}

	params.append("ep.utk", _ga);

	try {
		await adapter.trackEvent(`https://${hostname}/data/event/${btoa(params.toString())}`);
	} catch (err: any) {
		console.error("Failure", err);
	}
}
