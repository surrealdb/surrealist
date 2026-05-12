import { adapter } from "~/adapter";
import { MiniAdapter } from "~/adapter/mini";
import { SANDBOX } from "~/constants";
import { useConfigStore } from "~/stores/config";
import type {
	Authentication,
	AuthLevel,
	AuthMode,
	CloudInstance,
	Connection,
	Protocol,
} from "~/types";
import { createBaseConnection } from "./defaults";
import { connectionUri, fastParseJwt } from "./helpers";

/**
 * Returns the currently active connection
 *
 * FIXME: Completely repulsive hack, please lord forgive me for I have sinned
 */
export function getActiveConnection() {
	if (adapter instanceof MiniAdapter) {
		return SANDBOX;
	}

	const parts = location.pathname.split("/");

	parts.shift();

	if (parts[0] === "c") {
		return parts[1];
	}

	return null;
}

/**
 * Returns the currently active connection
 */
export function getConnection() {
	const { connections, sandbox } = useConfigStore.getState();
	const activeConnection = getActiveConnection();

	if (activeConnection === SANDBOX) {
		return sandbox;
	}

	return connections.find((con) => con.id === activeConnection);
}

/**
 * Returns a connection by its ID
 */
export function getConnectionById(connection: string) {
	const { connections, sandbox } = useConfigStore.getState();

	if (connection === SANDBOX) {
		return sandbox;
	}

	return connections.find((con) => con.id === connection);
}

/**
 * Returns the active query tab
 */
export function getActiveQuery() {
	const connection = getConnection();

	return connection?.queries.find((q) => q.id === connection.activeQuery);
}

/**
 * Returns the authentication level of the given mode
 */
export function getAuthLevel(auth: Authentication): AuthLevel {
	if (auth.mode === "cloud") {
		return "root";
	}

	if (getAuthDB(auth)) {
		return "database";
	}

	if (getAuthNS(auth)) {
		return "namespace";
	}

	return "root";
}

/**
 * Extract the database from the given authentication
 */
export function getAuthDB(auth: Authentication) {
	if (auth.mode === "token") {
		const payload = fastParseJwt(auth.token);

		if (!payload || !payload.DB) {
			return null;
		}

		return payload.DB;
	}

	if (auth.mode === "database" || auth.mode === "access" || auth.mode === "access-signup") {
		return auth.database;
	}

	return null;
}

/**
 * Extract the namespace from the given authentication
 */
export function getAuthNS(auth: Authentication) {
	if (auth.mode === "token") {
		const payload = fastParseJwt(auth.token);

		if (!payload || !payload.NS) {
			return null;
		}

		return payload.NS;
	}

	if (auth.mode === "namespace" || getAuthDB(auth)) {
		return auth.namespace;
	}

	return null;
}

/**
 * Returns whether the given connection is valid
 *
 * TODO Replace with validation
 */
export function isConnectionValid(auth: Authentication | undefined) {
	if (!auth) {
		return false;
	}

	try {
		connectionUri(auth.protocol, auth.hostname);
	} catch {
		return false;
	}

	// Check for essential fields
	const hasEssential = auth.protocol && auth.mode;

	if (!hasEssential) {
		return false;
	}

	// Check for hostname
	if (auth.protocol !== "mem" && auth.protocol !== "indxdb" && !auth.hostname) {
		return false;
	}

	// Check for username and password
	const checkUserPass =
		auth.mode === "root" || auth.mode === "database" || auth.mode === "namespace";
	const hasUserPass = auth.username && auth.password;

	if (checkUserPass && !hasUserPass) {
		return false;
	}

	// Check for namespace
	if (auth.mode === "namespace" && !auth.namespace) {
		return false;
	}

	// Check for database
	if (auth.mode === "database" && (!auth.namespace || !auth.database)) {
		return false;
	}

	// Check for token
	if (auth.mode === "token" && !auth.token) {
		return false;
	}

	// Check for access
	if (auth.mode === "access" && !auth.access) {
		return false;
	}

	return true;
}

/**
 * Resolve the connection for a CloudInstance, creating one
 * if it does not exist
 */
export function resolveInstanceConnection(instance: CloudInstance) {
	const { settings, addConnection, connections } = useConfigStore.getState();
	const connection = connections.find((c) => c.authentication.cloudInstance === instance.id);

	if (connection) {
		return connection;
	}

	const base = createBaseConnection(settings);

	addConnection({
		...base,
		name: instance.name,
		authentication: {
			...base.authentication,
			protocol: "wss",
			mode: "cloud",
			token: "",
			hostname: instance.host,
			cloudInstance: instance.id,
		},
	});

	return base;
}

/**
 * Connection spec parsed out of a `surrealist://<path>?<query>` deep link.
 * All fields are optional because external integrations (e.g. the JetBrains
 * plugin) may only know a subset of the connection details up front.
 */
export interface DeepLinkConnectionSpec {
	endpoint?: string;
	namespace?: string;
	database?: string;
	username?: string;
	password?: string;
	mode?: AuthMode;
}

/**
 * Connection protocols Surrealist accepts from a deep-link `endpoint=…` value
 * as a *remote* connection. `mem` and `indxdb` are handled separately —
 * Surrealist exposes them exclusively through the Sandbox, so
 * `resolveDeepLinkConnection` short-circuits to the Sandbox for those schemes
 * instead of trying to match or create a user-visible connection.
 */
const REMOTE_PROTOCOLS: ReadonlySet<Protocol> = new Set(["http", "https", "ws", "wss"]);

/**
 * Returns true when the deep-link `endpoint=…` should be served by Surrealist's
 * Sandbox connection. Today that means SurrealDB's in-memory protocol (`mem://`),
 * which is what the JetBrains language server defaults to when no remote
 * endpoint is configured. We deliberately accept variants like bare `mem:` and
 * `mem://anything` because the value is opaque user input we don't control.
 */
function isSandboxEndpoint(endpoint: string): boolean {
	return /^mem:/i.test(endpoint.trim());
}

/**
 * Parse the deep-link connection spec from a URL `searchParams`-like source.
 */
export function parseDeepLinkConnectionParams(params: URLSearchParams): DeepLinkConnectionSpec {
	const get = (key: string) => params.get(key)?.trim() || undefined;
	const rawMode = get("auth");

	return {
		endpoint: get("endpoint"),
		namespace: get("ns"),
		database: get("db"),
		username: get("user"),
		password: get("pass"),
		mode: isAuthMode(rawMode) ? rawMode : undefined,
	};
}

function isAuthMode(value: string | undefined): value is AuthMode {
	return (
		value === "none" ||
		value === "root" ||
		value === "namespace" ||
		value === "database" ||
		value === "token" ||
		value === "access" ||
		value === "access-signup" ||
		value === "cloud"
	);
}

/**
 * Split an `endpoint` URL into Surrealist's `protocol` + `hostname` pair.
 *
 * Examples:
 * - `ws://localhost:8000` → `{ protocol: "ws", hostname: "localhost:8000" }`
 * - `https://example.cloud.surrealdb.com` → `{ protocol: "https", hostname: "example.cloud.surrealdb.com" }`
 *
 * Returns `null` when the URL doesn't parse or uses an unsupported scheme.
 */
function parseEndpoint(endpoint: string): { protocol: Protocol; hostname: string } | null {
	try {
		const url = new URL(endpoint);
		const scheme = url.protocol.replace(/:$/, "").toLowerCase() as Protocol;

		if (!REMOTE_PROTOCOLS.has(scheme)) {
			return null;
		}

		const hostname = url.port ? `${url.hostname}:${url.port}` : url.hostname;

		return hostname ? { protocol: scheme, hostname } : null;
	} catch {
		return null;
	}
}

/**
 * Pick a sensible auth mode when the deep link didn't include `auth=…`.
 *
 * The rule is: credentials + database ⇒ database scope; credentials + ns
 * ⇒ namespace scope; credentials only ⇒ root; otherwise no auth.
 */
function inferAuthMode(spec: DeepLinkConnectionSpec): AuthMode {
	const hasCreds = Boolean(spec.username);

	if (!hasCreds) {
		return "none";
	}

	if (spec.database) {
		return "database";
	}

	if (spec.namespace) {
		return "namespace";
	}

	return "root";
}

/**
 * Resolve the connection a deep link points at — reusing an existing
 * connection when its endpoint + namespace + database + username match the
 * spec, and otherwise creating a new tagged connection so the user can find
 * it again later.
 *
 * `mem://` endpoints are special-cased: SurrealDB's in-memory protocol isn't
 * a user-creatable connection in Surrealist, so we route the file at the
 * Sandbox — the one connection that owns the in-memory engine. That keeps
 * parity with the JetBrains language server, which defaults to `mem://` when
 * no remote endpoint is configured.
 *
 * Returns `null` when the spec doesn't carry an `endpoint`, in which case the
 * caller should fall back to whichever connection is currently active.
 */
export function resolveDeepLinkConnection(spec: DeepLinkConnectionSpec): Connection | null {
	if (!spec.endpoint) {
		return null;
	}

	// Route mem:// to the Sandbox before we try to parse it as a remote URL —
	// `new URL("mem://")` is technically valid but its semantics don't match
	// what Surrealist's connection model expects (no host, no port, no auth).
	if (isSandboxEndpoint(spec.endpoint)) {
		return useConfigStore.getState().sandbox;
	}

	const parsed = parseEndpoint(spec.endpoint);
	if (!parsed) {
		return null;
	}

	const { protocol, hostname } = parsed;
	const namespace = spec.namespace ?? "";
	const database = spec.database ?? "";
	const username = spec.username ?? "";
	const password = spec.password ?? "";
	const mode = spec.mode ?? inferAuthMode(spec);

	const { connections, addConnection, settings } = useConfigStore.getState();

	// Match an existing connection by the externally-visible fields so we
	// don't keep stamping out duplicates when the user reopens the same file.
	const existing = connections.find((c) => {
		const auth = c.authentication;
		return (
			auth.protocol === protocol &&
			auth.hostname === hostname &&
			auth.namespace === namespace &&
			auth.database === database &&
			auth.username === username
		);
	});

	if (existing) {
		return existing;
	}

	const base = createBaseConnection(settings);
	const connection: Connection = {
		...base,
		name: hostname || "JetBrains connection",
		labels: Array.from(new Set([...(base.labels ?? []), "jetbrains"])),
		lastNamespace: namespace,
		lastDatabase: database,
		authentication: {
			...base.authentication,
			protocol,
			hostname,
			username,
			password,
			namespace,
			database,
			mode,
		},
	};

	addConnection(connection);

	return connection;
}

export type ConnectionVariant = "browser" | "localhost" | "cloud" | "remote";

/**
 * Returns the variant of the specified connection
 */
export function getConnectionVariant(connection: Connection) {
	const { mode, protocol, hostname } = connection.authentication;

	if (mode === "cloud") {
		return "cloud";
	}

	if (protocol === "mem" || protocol === "indxdb") {
		return "browser";
	}

	if (hostname === "localhost" || hostname === "127.0.0.1") {
		return "localhost";
	}

	return "remote";
}
