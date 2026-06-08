import { describe, expect, test } from "bun:test";
import { mapTokenEndpointResponse } from "./oauth-webapi";

describe("mapTokenEndpointResponse", () => {
	test("maps standard token fields", () => {
		const mapped = mapTokenEndpointResponse({
			access_token: "access",
			token_type: "bearer",
			expires_in: 3600,
			refresh_token: "refresh",
			refresh_token_expires_in: 86_400,
		});

		expect(mapped.access_token).toBe("access");
		expect(mapped.token_type).toBe("bearer");
		expect(mapped.expires_in).toBe(3600);
		expect(mapped.refresh_token).toBe("refresh");
		expect(mapped.refresh_token_expires_in).toBe(86_400);
	});
});
