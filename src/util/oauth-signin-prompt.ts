import type { Authentication, Connection } from "~/types";

export type OAuthSignInRequest = {
	connection: Connection;
	resolve: (auth: Authentication) => void;
	reject: (reason?: Error) => void;
};

let pending: OAuthSignInRequest | null = null;

export function getPendingOAuthSignIn() {
	return pending;
}

export function requestOAuthSignIn(connection: Connection): Promise<Authentication> {
	if (pending) {
		pending.reject(new Error("OAuth sign-in was interrupted"));
	}

	return new Promise((resolve, reject) => {
		pending = {
			connection,
			resolve: (auth) => {
				pending = null;
				resolve(auth);
			},
			reject: (reason) => {
				pending = null;
				reject(reason ?? new OAuthSignInCancelled());
			},
		};
	});
}

export function completeOAuthSignIn(auth: Authentication) {
	pending?.resolve(auth);
}

export class OAuthSignInCancelled extends Error {
	constructor() {
		super("OAuth sign-in was cancelled");
		this.name = "OAuthSignInCancelled";
	}
}

export function cancelOAuthSignIn(reason?: Error) {
	pending?.reject(reason ?? new OAuthSignInCancelled());
}
