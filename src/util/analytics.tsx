import { adapter } from "~/adapter";
import { getSetting } from "./config";
import { isPreview, isProduction } from "./environment";
import { featureFlags } from "./feature-flags";
import { CLIENT_KEY } from "./storage";

let incrementalId = 1;

export const HOSTNAME = isProduction
	? "surrealist.app"
	: isPreview
		? "beta.surrealist.app"
		: "dev.surrealist.app";

/**
 * Track analytics events
 */
export async function tagEvent(name: string, payload: Record<string, unknown> = {}) {
	const { gtm_debug } = featureFlags.store;
	const debug_origin = getSetting("gtm", "origin");
	const debug_mode = getSetting("gtm", "debug_mode");
	const hostname = (gtm_debug && debug_origin) || HOSTNAME;
	const uniqueId = (incrementalId++).toString();
	const params = new URLSearchParams();

	let client = localStorage.getItem(CLIENT_KEY);

	if (!client) {
		client = Math.random().toString(36).substring(0, 16);
		localStorage.setItem(CLIENT_KEY, client);
	}

	params.append("v", "2");
	params.append("tid", import.meta.env.GTM_ID);
	params.append("cid", client);
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

	try {
		await adapter.trackEvent(`https://${hostname}/data/event/${btoa(params.toString())}`);
	} catch (err: any) {
		console.error("Failure", err);
	}
}
