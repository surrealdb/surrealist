import { isOAuthFeatureEnabled } from "./feature-flags";

export class OAuthFeatureDisabledError extends Error {
	constructor() {
		super("OAuth is not enabled in this environment");
		this.name = "OAuthFeatureDisabledError";
	}
}

export function assertOAuthFeatureEnabled() {
	if (!isOAuthFeatureEnabled()) {
		throw new OAuthFeatureDisabledError();
	}
}
