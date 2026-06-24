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

export function identifyReoUser(user: User) {
	// if (!isProduction || !adapter.isTelemetryEnabled) {
	// 	return;
	// }

	const identity = buildReoIdentity(user);

	if (!identity) {
		return;
	}

	window.Reo?.identify(identity);
}
