import type { User } from "@auth0/auth0-react";
import { adapter } from "~/adapter";
import { isProduction } from "./environment";

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

const REO_IDENTIFY_MAX_ATTEMPTS = 20;
const REO_IDENTIFY_RETRY_MS = 250;

function invokeReoIdentify(identity: ReoIdentity, attempt = 0) {
	if (window.Reo?.identify) {
		try {
			window.Reo.identify(identity);
		} catch (err) {
			console.error("Failed to identify user with Reo", err);
		}

		return;
	}

	if (attempt >= REO_IDENTIFY_MAX_ATTEMPTS) {
		return;
	}

	window.setTimeout(() => invokeReoIdentify(identity, attempt + 1), REO_IDENTIFY_RETRY_MS);
}

export function identifyReoUser(user: User) {
	if (!isProduction || !adapter.isTelemetryEnabled) {
		return;
	}

	const identity = buildReoIdentity(user);

	if (!identity) {
		return;
	}

	invokeReoIdentify(identity);
}
