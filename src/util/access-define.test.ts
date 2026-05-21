import { describe, expect, test } from "bun:test";
import {
	buildDefineAccessQuery,
	defaultAccessDefineForm,
	validateAccessDefineForm,
} from "./access-define";

function oauthJwtForm() {
	const form = defaultAccessDefineForm("ROOT");
	form.name = "okta";
	form.type = "JWT";
	form.oidcIssuer = "https://example.okta.com";
	form.oauth.enabled = true;
	form.oauth.clientId = "client-id";
	form.oauth.scopes = ["openid", "email"];
	form.oauth.redirectUris = ["https://app.example.com/callback"];
	return form;
}

describe("validateAccessDefineForm", () => {
	test("requires at least one non-empty redirect URI when OAuth is enabled", () => {
		const form = oauthJwtForm();
		form.oauth.redirectUris = [""];

		expect(validateAccessDefineForm(form)).toBe(
			"At least one redirect URI is required when OAuth is enabled",
		);
	});

	test("accepts redirect URIs with surrounding whitespace", () => {
		const form = oauthJwtForm();
		form.oauth.redirectUris = ["  https://app.example.com/callback  "];

		expect(validateAccessDefineForm(form)).toBeNull();
	});

	test("rejects OAuth when redirect URI list is empty", () => {
		const form = oauthJwtForm();
		form.oauth.redirectUris = [];

		expect(validateAccessDefineForm(form)).toBe(
			"At least one redirect URI is required when OAuth is enabled",
		);
	});
});

describe("buildDefineAccessQuery", () => {
	test("filters empty redirect URIs from REDIRECT_URIS", () => {
		const form = oauthJwtForm();
		form.oauth.redirectUris = ["https://app.example.com/callback", "", "  "];

		const query = buildDefineAccessQuery(form);

		expect(query).toContain('REDIRECT_URIS ["https://app.example.com/callback"]');
		expect(query).not.toContain('""');
	});
});
