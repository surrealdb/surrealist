import { describe, expect, test } from "bun:test";
import type { Authentication } from "~/types";
import {
	applyOAuthTokenResponse,
	normalizeRedirectUri,
	redirectUriListIncludes,
} from "./oauth-core";

function oauthAuth(overrides: Partial<Authentication> = {}): Authentication {
	return {
		mode: "oauth",
		protocol: "ws",
		hostname: "example.com:8000",
		username: "",
		password: "",
		namespace: "",
		database: "",
		token: "old-access-token",
		access: "",
		accessFields: [],
		oauthRefreshToken: "stored-refresh-token",
		oauthUseRefreshToken: true,
		...overrides,
	};
}

describe("applyOAuthTokenResponse", () => {
	test("preserves refresh token when refresh response omits it", () => {
		const auth = oauthAuth();
		const next = applyOAuthTokenResponse(auth, {
			access_token: "new-access-token",
			expires_in: 3600,
		});

		expect(next.token).toBe("new-access-token");
		expect(next.oauthRefreshToken).toBe("stored-refresh-token");
	});

	test("replaces refresh token when refresh response includes it", () => {
		const auth = oauthAuth();
		const next = applyOAuthTokenResponse(auth, {
			access_token: "new-access-token",
			refresh_token: "rotated-refresh-token",
			expires_in: 3600,
		});

		expect(next.oauthRefreshToken).toBe("rotated-refresh-token");
	});

	test("clears refresh token when refresh tokens are disabled", () => {
		const auth = oauthAuth({ oauthUseRefreshToken: false });
		const next = applyOAuthTokenResponse(auth, {
			access_token: "new-access-token",
			refresh_token: "ignored-refresh-token",
		});

		expect(next.oauthRefreshToken).toBe("");
		expect(next.oauthRefreshTokenExpiresAt).toBeUndefined();
	});
});

describe("redirectUriListIncludes", () => {
	test("matches URIs with surrounding whitespace", () => {
		const uris = ["  https://app.example.com/callback  "];

		expect(redirectUriListIncludes(uris, "https://app.example.com/callback")).toBe(true);
	});

	test("does not match different URIs", () => {
		expect(
			redirectUriListIncludes(
				["https://app.example.com/callback"],
				"https://app.example.com/launch",
			),
		).toBe(false);
	});

	test("normalizeRedirectUri trims whitespace", () => {
		expect(normalizeRedirectUri("  https://example.com  ")).toBe("https://example.com");
	});
});
