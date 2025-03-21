import { adapter } from "~/adapter";
import { isPreview, isProduction } from "./environment";
import { CLIENT_KEY } from "./storage";

let incrementalId = 1;

const HOSTNAME = isProduction
	? "surrealist.app"
	: isPreview
		? "beta.surrealist.app"
		: "dev.surrealist.app";

/**
 * Track analytics events
 */
export function tagEvent(name: string, payload: Record<string, unknown> = {}) {
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

	params.append("ep.surrealist_version", import.meta.env.VERSION);
	params.append("ep.surrealist_platform", adapter.platform);
	params.append("ep.surrealist_adapter", adapter.id);
	params.append("ep.surrealist_mode", import.meta.env.MODE);

	for (const [key, value] of Object.entries(payload)) {
		params.append(`epn.${key}`, `${value}`);
	}

	fetch(`https://${HOSTNAME}/data/event/${btoa(params.toString())}`, {
		method: "POST",
		mode: "no-cors",
		credentials: "include",
		headers: {
			"Content-Type": "text/plain;charset=UTF-8",
		},
		body: "",
	});
}
