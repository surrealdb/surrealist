import { describe, expect, test } from "bun:test";
import { parseOAuthCallback } from "./oauth-core";

describe("parseOAuthCallback", () => {
	test("returns ok when code and state both match", () => {
		expect(
			parseOAuthCallback(
				"http://localhost/auth/surreal/callback?code=abc&state=expected",
				"expected",
			),
		).toEqual({ kind: "ok", code: "abc", state: "expected" });
	});

	test("rejects state mismatch", () => {
		expect(
			parseOAuthCallback(
				"http://localhost/auth/surreal/callback?code=abc&state=wrong",
				"expected",
			),
		).toEqual({ kind: "error", message: "OAuth state mismatch" });
	});

	test("surfaces error_description from the IdP", () => {
		expect(
			parseOAuthCallback(
				"http://localhost/auth/surreal/callback?error=access_denied&error_description=User%20denied%20access",
				"expected",
			),
		).toEqual({ kind: "error", message: "User denied access" });
	});

	test("falls back to error code when description is missing", () => {
		expect(
			parseOAuthCallback(
				"http://localhost/auth/surreal/callback?error=invalid_request",
				"expected",
			),
		).toEqual({ kind: "error", message: "invalid_request" });
	});

	test("reports incomplete for malformed URLs (keep waiting)", () => {
		expect(parseOAuthCallback("not a url", "expected")).toEqual({ kind: "incomplete" });
	});

	test("reports incomplete when code or state is missing", () => {
		expect(parseOAuthCallback("http://localhost/cb", "expected")).toEqual({
			kind: "incomplete",
		});
		expect(parseOAuthCallback("http://localhost/cb?code=abc", "expected")).toEqual({
			kind: "incomplete",
		});
		expect(parseOAuthCallback("http://localhost/cb?state=expected", "expected")).toEqual({
			kind: "incomplete",
		});
	});
});
