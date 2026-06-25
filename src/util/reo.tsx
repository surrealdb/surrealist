import type { User } from "@auth0/auth0-react";
import { adapter } from "~/adapter";
import { isProduction } from "./environment";

const REO_EMBED_ID = "c07f38f6d83bb7e";
const REO_CLIENT_ID = "9730f5c7b41fbdd";

let initPromise: Promise<void> | undefined;

export function initializeReo(): Promise<void> | undefined {
	if (!isProduction || !adapter.isTelemetryEnabled) {
		return;
	}

	if (initPromise) {
		return initPromise;
	}

	initPromise = new Promise<void>((resolve, reject) => {
		const script = document.createElement("script");

		script.src = `https://static.reo.dev/${REO_EMBED_ID}/reo.js`;
		script.defer = true;
		script.onload = () => {
			window.Reo?.init({ clientID: REO_CLIENT_ID });
			resolve();
		};
		script.onerror = () => {
			reject(new Error("Failed to load Reo script"));
		};

		document.head.appendChild(script);
	}).catch((error: unknown) => {
		console.error("Failed to initialize Reo", error);
	});

	return initPromise;
}

function emailDomain(email?: string) {
	if (!email?.includes("@")) {
		return undefined;
	}

	return email.split("@")[1]?.toLowerCase();
}

function buildReoIdentity(user: User): ReoIdentity | null {
	if (!user.email) {
		return null;
	}

	return {
		username: user.email,
		type: "email",
		firstname: user.given_name,
		lastname: user.family_name,
		company: emailDomain(user.email),
	};
}

export function identifyReoUser(user: User) {
	if (!isProduction || !adapter.isTelemetryEnabled) {
		return;
	}

	const identity = buildReoIdentity(user);

	if (!identity) {
		return;
	}

	window.Reo?.identify(identity);
}
