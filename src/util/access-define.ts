import { escapeIdent } from "surrealdb";
import type { AccessType, Base, SchemaAccess } from "~/types";

export type OAuthEndpointMode = "discovery" | "explicit";

export type JwtVerifyMode = "url" | "keyalg";

const REDACTED_SECRET = "[REDACTED]";

export interface AccessJwtOAuthForm {
	enabled: boolean;
	endpointMode: OAuthEndpointMode;
	authorizeUrl: string;
	tokenUrl: string;
	clientId: string;
	clientSecret: string;
	scopes: string[];
	audience: string;
	redirectUris: string[];
}

export interface AccessDefineForm {
	name: string;
	level: Base;
	type: AccessType;
	authenticate: string;
	signup: string;
	signin: string;
	tokenDuration: string;
	sessionDuration: string;
	comment: string;
	recordJwtEnabled: boolean;
	oidcIssuer: string;
	jwtVerifyMode: JwtVerifyMode;
	jwtVerifyUrl: string;
	jwtVerifyAlg: string;
	jwtVerifyKey: string;
	issueKey: string;
	oauth: AccessJwtOAuthForm;
}

export function defaultAccessDefineForm(level: Base): AccessDefineForm {
	return {
		name: "",
		level,
		type: level === "DATABASE" ? "RECORD" : "JWT",
		authenticate: "",
		signup: "",
		signin: "",
		tokenDuration: "1h",
		sessionDuration: "",
		comment: "",
		recordJwtEnabled: false,
		oidcIssuer: "",
		jwtVerifyMode: "keyalg",
		jwtVerifyUrl: "",
		jwtVerifyAlg: "HS256",
		jwtVerifyKey: "",
		issueKey: "",
		oauth: {
			enabled: false,
			endpointMode: "discovery",
			authorizeUrl: "",
			tokenUrl: "",
			clientId: "",
			clientSecret: "",
			scopes: ["openid", "email"],
			audience: "",
			redirectUris: [],
		},
	};
}

function escapeString(value: string) {
	return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function parseJwtFromStructure(jwt: Record<string, unknown> | undefined) {
	if (!jwt) {
		return null;
	}

	const verify = jwt.verify as Record<string, unknown> | undefined;
	let jwtVerifyMode: JwtVerifyMode = "keyalg";
	let jwtVerifyUrl = "";
	let jwtVerifyAlg = "HS256";
	let jwtVerifyKey = "";

	if (verify) {
		if (typeof verify.url === "string") {
			jwtVerifyMode = "url";
			jwtVerifyUrl = verify.url;
		} else if (typeof verify.alg === "string") {
			jwtVerifyMode = "keyalg";
			jwtVerifyAlg = verify.alg;
			jwtVerifyKey =
				typeof verify.key === "string" && verify.key !== REDACTED_SECRET
					? verify.key
					: verify.key === REDACTED_SECRET
						? REDACTED_SECRET
						: "";
		}
	}

	const issue = jwt.issuer as Record<string, unknown> | undefined;
	const issueKey = typeof issue?.key === "string" ? issue.key : "";

	const oidcIssuer = typeof jwt.oidc_issuer === "string" ? jwt.oidc_issuer : "";

	const oauthRaw = jwt.oauth as Record<string, unknown> | undefined;
	const oauth = parseOAuthFromStructure(oauthRaw);

	const hasJwtBlock = !!verify || !!oidcIssuer || !!oauth.enabled;

	return {
		oidcIssuer,
		jwtVerifyMode,
		jwtVerifyUrl,
		jwtVerifyAlg,
		jwtVerifyKey,
		issueKey,
		oauth,
		hasJwtBlock,
	};
}

function parseOAuthFromStructure(oauth: Record<string, unknown> | undefined): AccessJwtOAuthForm {
	if (!oauth) {
		return defaultAccessDefineForm("ROOT").oauth;
	}

	const scopes = Array.isArray(oauth.scopes)
		? oauth.scopes.filter((s): s is string => typeof s === "string")
		: [];

	const redirectUris = Array.isArray(oauth.redirect_uris)
		? oauth.redirect_uris.filter((s): s is string => typeof s === "string")
		: [];

	const authorizeUrl = typeof oauth.authorize_url === "string" ? oauth.authorize_url : "";
	const tokenUrl = typeof oauth.token_url === "string" ? oauth.token_url : "";
	const hasExplicitEndpoints = !!(authorizeUrl && tokenUrl);

	return {
		enabled: true,
		endpointMode: hasExplicitEndpoints ? "explicit" : "discovery",
		authorizeUrl,
		tokenUrl,
		clientId: typeof oauth.client_id === "string" ? oauth.client_id : "",
		clientSecret:
			typeof oauth.client_secret === "string" ? oauth.client_secret : REDACTED_SECRET,
		scopes: scopes.length > 0 ? scopes : ["openid", "email"],
		audience: typeof oauth.audience === "string" ? oauth.audience : "",
		redirectUris,
	};
}

export function accessDefineFormFromSchema(
	access: SchemaAccess | null,
	level: Base,
): AccessDefineForm {
	const defaults = defaultAccessDefineForm(level);

	if (!access) {
		return defaults;
	}

	const kind = access.kind as Record<string, unknown>;
	const kindName = kind.kind as string;

	const base: AccessDefineForm = {
		...defaults,
		name: access.name,
		level,
		type: kindName === "RECORD" ? "RECORD" : "JWT",
		authenticate: stripBlock(access.authenticate ?? ""),
		comment: access.comment ?? "",
		tokenDuration: access.duration.token?.toString() ?? "",
		sessionDuration: access.duration.session?.toString() ?? "",
	};

	const jwt = kind.jwt as Record<string, unknown> | undefined;
	const parsedJwt = parseJwtFromStructure(jwt);

	if (kindName === "RECORD") {
		base.signup = stripBlock((kind.signup as string) ?? "");
		base.signin = stripBlock((kind.signin as string) ?? "");
	}

	if (parsedJwt) {
		base.recordJwtEnabled = kindName === "JWT" ? true : parsedJwt.hasJwtBlock;
		base.oidcIssuer = parsedJwt.oidcIssuer;
		base.jwtVerifyMode = parsedJwt.jwtVerifyMode;
		base.jwtVerifyUrl = parsedJwt.jwtVerifyUrl;
		base.jwtVerifyAlg = parsedJwt.jwtVerifyAlg;
		base.jwtVerifyKey = parsedJwt.jwtVerifyKey;
		base.issueKey = parsedJwt.issueKey;
		base.oauth = parsedJwt.oauth;

		if (parsedJwt.oidcIssuer) {
			base.oauth.endpointMode = "discovery";
		}
	}

	return base;
}

function stripBlock(value: string) {
	return value.replace(/^\{|\}$/g, "").trim();
}

export function validateAccessDefineForm(form: AccessDefineForm): string | null {
	if (!form.name.trim()) {
		return "Access method name is required";
	}

	const needsJwt = form.type === "JWT" || (form.type === "RECORD" && form.recordJwtEnabled);

	if (needsJwt && !form.oidcIssuer.trim()) {
		const hasVerify =
			form.jwtVerifyMode === "url"
				? !!form.jwtVerifyUrl.trim()
				: !!form.jwtVerifyAlg.trim() && !!form.jwtVerifyKey.trim();

		if (!hasVerify) {
			return "JWT access requires an OIDC issuer URL or token verification settings";
		}
	}

	if (form.oauth.enabled) {
		if (!form.oauth.clientId.trim()) {
			return "OAuth client ID is required";
		}

		if (form.oauth.scopes.length === 0) {
			return "At least one OAuth scope is required";
		}

		if (form.oauth.endpointMode === "discovery") {
			if (!form.oidcIssuer.trim()) {
				return "OIDC issuer URL is required for OAuth discovery mode";
			}

			if (form.oauth.authorizeUrl.trim() || form.oauth.tokenUrl.trim()) {
				return "Remove explicit authorize/token URLs when using OIDC discovery";
			}
		} else {
			if (!form.oauth.authorizeUrl.trim() || !form.oauth.tokenUrl.trim()) {
				return "OAuth authorize and token URLs are required in explicit endpoint mode";
			}

			if (form.oidcIssuer.trim()) {
				return "Remove OIDC issuer URL when using explicit OAuth endpoints";
			}
		}

		const redirectUris = form.oauth.redirectUris.map((uri) => uri.trim()).filter(Boolean);

		if (redirectUris.length === 0) {
			return "At least one redirect URI is required when OAuth is enabled";
		}
	}

	return null;
}

function appendJwtVerify(query: string, form: AccessDefineForm) {
	let block = query;

	if (form.oidcIssuer.trim()) {
		block += ` ISSUER "${escapeString(form.oidcIssuer.trim())}"`;
	}

	if (form.jwtVerifyMode === "url") {
		if (form.jwtVerifyUrl.trim()) {
			block += ` URL "${escapeString(form.jwtVerifyUrl.trim())}"`;
		}

		return block;
	}

	const verifyKey = form.jwtVerifyKey.trim();

	if (verifyKey && verifyKey !== REDACTED_SECRET) {
		block += ` ALGORITHM ${form.jwtVerifyAlg} KEY "${escapeString(verifyKey)}"`;
	}

	return block;
}

function appendWithOauth(query: string, form: AccessDefineForm) {
	if (!form.oauth.enabled) {
		return query;
	}

	let block = ` WITH OAUTH`;

	if (form.oauth.endpointMode === "explicit") {
		block += ` AUTHORIZE "${escapeString(form.oauth.authorizeUrl.trim())}"`;
		block += ` TOKEN "${escapeString(form.oauth.tokenUrl.trim())}"`;
	}

	block += ` CLIENT "${escapeString(form.oauth.clientId.trim())}"`;

	const secret = form.oauth.clientSecret.trim();

	if (secret && secret !== REDACTED_SECRET) {
		block += ` SECRET "${escapeString(secret)}"`;
	}

	if (form.oauth.scopes.length > 0) {
		const scopes = form.oauth.scopes.map((s) => `"${escapeString(s)}"`).join(", ");
		block += ` SCOPES [${scopes}]`;
	}

	if (form.oauth.audience.trim()) {
		block += ` AUDIENCE "${escapeString(form.oauth.audience.trim())}"`;
	}

	const redirectUris = form.oauth.redirectUris.map((uri) => uri.trim()).filter(Boolean);

	if (redirectUris.length > 0) {
		const uris = redirectUris.map((u) => `"${escapeString(u)}"`).join(", ");
		block += ` REDIRECT_URIS [${uris}]`;
	}

	return query + block;
}

export function buildDefineAccessQuery(form: AccessDefineForm) {
	let query = `DEFINE ACCESS OVERWRITE ${escapeIdent(form.name)} ON ${form.level} TYPE`;

	if (form.type === "RECORD") {
		query += " RECORD";

		if (form.signup.trim()) {
			query += ` SIGNUP { ${form.signup.trim()} }`;
		}

		if (form.signin.trim()) {
			query += ` SIGNIN { ${form.signin.trim()} }`;
		}

		if (form.recordJwtEnabled) {
			query += " WITH JWT";
			query = appendJwtVerify(query, form);

			if (form.issueKey.trim()) {
				query += ` WITH ISSUER KEY "${escapeString(form.issueKey.trim())}"`;
			}

			query = appendWithOauth(query, form);
		}
	} else {
		query += " JWT";
		query = appendJwtVerify(query, form);
		query = appendWithOauth(query, form);
	}

	if (form.authenticate.trim()) {
		query += ` AUTHENTICATE { ${form.authenticate.trim()} }`;
	}

	query += ` DURATION FOR TOKEN ${form.tokenDuration.trim() || "NONE"} FOR SESSION ${form.sessionDuration.trim() || "NONE"}`;

	if (form.comment.trim()) {
		query += ` COMMENT "${escapeString(form.comment.trim())}"`;
	}

	return query;
}

export function accessHasOAuth(access: SchemaAccess) {
	const jwt = (access.kind as { jwt?: { oauth?: unknown } }).jwt;
	return !!jwt?.oauth;
}
