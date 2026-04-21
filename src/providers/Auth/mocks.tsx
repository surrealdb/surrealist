import { useSyncExternalStore } from "react";

const STORAGE_KEY = "surrealist:mock-email-verified";
const EVENT = "surrealist:mock-email-verified-change";

type Mock = "verified" | "unverified" | null;

function readMock(): Mock {
	if (typeof window === "undefined") return null;

	const value = window.sessionStorage.getItem(STORAGE_KEY);

	if (value === "verified" || value === "unverified") {
		return value;
	}

	return null;
}

function writeMock(value: Mock) {
	if (typeof window === "undefined") return;

	if (value === null) {
		window.sessionStorage.removeItem(STORAGE_KEY);
	} else {
		window.sessionStorage.setItem(STORAGE_KEY, value);
	}

	window.dispatchEvent(new CustomEvent(EVENT));
}

function subscribe(callback: () => void): () => void {
	if (typeof window === "undefined") return () => {};

	window.addEventListener(EVENT, callback);
	window.addEventListener("storage", callback);

	return () => {
		window.removeEventListener(EVENT, callback);
		window.removeEventListener("storage", callback);
	};
}

/**
 * Subscribes to the current email-verified mock override.
 *
 * Returns `null` when no mock is active and the real Auth0 value should be
 * used. Returns `"verified"` or `"unverified"` to force the override.
 */
export function useEmailVerifiedMock(): Mock {
	return useSyncExternalStore(subscribe, readMock, () => null);
}

/**
 * Debug helpers exposed on `window.Surrealist` for testing the email
 * verification onboarding flow without needing an unverified Auth0 account.
 */
export const emailVerifiedMockDebug = {
	mockEmailUnverified: () => writeMock("unverified"),
	mockEmailVerified: () => writeMock("verified"),
	clearEmailMock: () => writeMock(null),
};
