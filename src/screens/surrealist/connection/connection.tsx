import { compareVersions } from "compare-versions";
import {
	AccessAuth,
	type AccessRecordAuth,
	SqlExportOptions,
	Surreal,
	SystemAuth,
	Token,
	UnsupportedVersionError,
	Uuid,
} from "surrealdb";
import { adapter } from "~/adapter";
import { fetchAPI } from "~/cloud/api";
import { MAX_HISTORY_QUERY_LENGTH, SANDBOX } from "~/constants";
import { useCloudStore } from "~/stores/cloud";
import { useConfigStore } from "~/stores/config";
import { State, useDatabaseStore } from "~/stores/database";
import { useInterfaceStore } from "~/stores/interface";
import { useQueryStore } from "~/stores/query";
import type {
	AuthDetails,
	Authentication,
	CloudInstance,
	Connection,
	Protocol,
	QueryResponse,
	SchemaInfoKV,
	SchemaInfoNS,
} from "~/types";
import { tagEvent } from "~/util/analytics";
import { getSetting } from "~/util/config";
import { getActiveConnection, getAuthDB, getAuthNS, getConnection } from "~/util/connection";
import { surqlDurationToSeconds } from "~/util/duration";
import { CloudError } from "~/util/errors";
import { ActivateDatabaseEvent, ConnectedEvent, DisconnectedEvent } from "~/util/global-events";
import { __throw, connectionUri, newId, showErrorNotification, showWarning } from "~/util/helpers";
import { parseIdent } from "~/util/language";
import { syncConnectionSchema } from "~/util/schema";
import { createSurrealQL } from "~/util/surql";
import { SurrealQL } from "~/util/surql/surrealql";
import { composeAuthentication, getVersionTimeout } from "./helpers";
import { createSurreal } from "./surreal";

export interface ConnectOptions {
	connection?: Connection;
	isRetry?: boolean;
}

export interface UserQueryOptions {
	override?: string;
}

export interface GraphqlResponse {
	success: boolean;
	result: any;
	errors?: any;
}

let retryTask: any;
let openedConnection: Connection;
let instance = new Surreal();
let surrealql: SurrealQL | null = null;

const LQ_SUPPORTED = new Set<Protocol>(["ws", "wss", "mem", "indxdb"]);
const LIVE_QUERIES = new Map<string, Set<Uuid>>();

/**
 * Open a new connection to the data
 *
 * @param options Connection options
 */
export async function openConnection(options?: ConnectOptions) {
	const currentConnection = getConnection();
	const connection = options?.connection || currentConnection;

	if (!connection) {
		throw new Error("No connection available");
	}

	const newState = options?.isRetry ? "retrying" : "connecting";
	const strict = getSetting("behavior", "strictSandbox");
	const surreal = await createSurreal({ strict });

	await _closeConnection(newState, false);

	instance = surreal;
	openedConnection = connection;

	const { setCurrentState, setVersion, setLatestError, clearSchema } =
		useDatabaseStore.getState();

	const rpcEndpoint = connectionUri(
		connection.authentication.protocol,
		connection.authentication.hostname,
	);

	clearSchema();

	adapter.log("DB", `Opening connection to ${rpcEndpoint}`);

	if (retryTask) {
		clearTimeout(retryTask);
		retryTask = null;
	}

	const authDetails = await composeAuthentication(connection.authentication);
	const managedAuth = extractManagedAuth(authDetails);
	const accessAuth = extractAccessAuth(authDetails);

	instance.subscribe("connecting", () => {
		setCurrentState("connecting");
	});

	instance.subscribe("reconnecting", () => {
		setCurrentState("retrying");
	});

	instance.subscribe("disconnected", () => {
		DisconnectedEvent.dispatch(null);

		setCurrentState("disconnected");
		setVersion("");
	});

	instance.subscribe("error", (err) => {
		setLatestError(err.message);
		console.dir(err);
	});

	instance.subscribe("auth", (state) => {
		if (accessAuth && !state) {
			adapter.log("DB", "Restoring access authentication");
			instance.signin(accessAuth);
		}
	});

	try {
		const [versionCheck] = getVersionTimeout();

		if (connection.authentication.mode === "cloud") {
			const { authState } = useCloudStore.getState();

			if (authState === "loading" || authState === "unknown") {
				scheduleReconnect(1000);
				return;
			}

			if (authState === "unauthenticated") {
				throw new CloudError("Not authenticated with SurrealDB Cloud");
			}

			const instance = await fetchAPI<CloudInstance>(
				`/instances/${connection.authentication.cloudInstance}`,
			);

			if (!instance || instance.state !== "ready") {
				return;
			}
		}

		const namespace = getAuthNS(connection.authentication) || connection.lastNamespace;
		const database = getAuthDB(connection.authentication) || connection.lastDatabase;

		try {
			await instance.connect(rpcEndpoint, {
				versionCheck,
				reconnect: {
					enabled: true,
					attempts: -1,
					retryDelayMultiplier: 1.2,
					retryDelayJitter: 0,
				},
				authentication: managedAuth,
			});
		} catch (err: any) {
			console.error("Connection failed", err);
		}

		adapter.log("DB", "Connection established");

		const v = await instance.version();
		const version = v.version.replace(/^surrealdb-/, "");
		const isPreview = version.includes("-alpha") || version.includes("-beta");

		if (isPreview) {
			showWarning({
				autoClose: 10_000,
				title: "Preview version detected",
				subtitle:
					"You are connected to a preview version of SurrealDB. Some features may not work as intended.",
			});
		}

		adapter.log("DB", `Database version ${version ?? "unknown"}`);

		surrealql = createSurrealQL(version);

		setVersion(version);
		setCurrentState("connected");
		setLatestError("");

		if (connection.id === SANDBOX) {
			await instance.use({
				namespace: "sandbox",
				database: "sandbox",
			});

			await instance.query("DEFINE NAMESPACE IF NOT EXISTS sandbox");
			await instance.query("DEFINE DATABASE IF NOT EXISTS sandbox");
		} else {
			await activateDatabase(namespace, database);
		}

		if (accessAuth) {
			await instance.signin(accessAuth);
		}

		ConnectedEvent.dispatch(null);

		tagEvent("connection_connected", {
			protocol: connection.authentication.protocol.toString(),
		});
	} catch (err: any) {
		console.error("Connection failed", err);
		instance.close();

		setLatestError(err.message);

		if (err instanceof UnsupportedVersionError) {
			showErrorNotification({
				title: "Unsupported version",
				content: `The database version (${err.version}) must satisfy ">= ${err.minimum} < ${err.maximum}"`,
			});
		} else if (!(err instanceof CloudError)) {
			console.error(err);
			showErrorNotification({
				title: "Connection failed",
				content: err,
			});
		}
	}
}

async function _closeConnection(state: State, reconnect: boolean) {
	const { setCurrentState, setVersion } = useDatabaseStore.getState();

	await instance.close();

	setCurrentState(state);
	setVersion("");

	if (reconnect) {
		await openConnection();
	}
}

/**
 * Close the active surreal connection
 */
export async function closeConnection(reconnect: boolean = false) {
	await _closeConnection(reconnect ? "retrying" : "disconnected", reconnect);
}

/**
 * Returns whether the connection is considered active
 */
export function isConnected() {
	return instance.status === "connected" || instance.status === "connecting";
}

/**
 * Register a new record access user
 *
 * @param auth The authentication details
 * @param surreal The optional surreal instance
 */
export async function register(auth: AccessRecordAuth, surreal?: Surreal) {
	const db = surreal ?? instance;

	await db.signup(auth).catch(() => {
		throw new Error("Could not sign up");
	});
}

/**
 * Authenticate the connection
 *
 * @param auth The authentication details
 * @param surreal The optional surreal instance
 */
export async function authenticate(auth: AuthDetails, surreal?: Surreal) {
	const db = surreal ?? instance;

	if (auth === undefined) {
		await db.invalidate();
	} else if (typeof auth === "string") {
		await db.authenticate(auth).catch(() => {
			throw new Error("Authentication token invalid");
		});
	} else if (auth) {
		await db.signin(auth).catch((err) => {
			const { openAccessSignup } = useInterfaceStore.getState();

			if (err.message.includes("No record was returned")) {
				openAccessSignup();
			} else {
				throw new Error(err.message);
			}
		});
	}
}

/**
 * Execute a query against the active connection
 */
export async function executeQuery(
	query: string,
	bindings?: Record<string, unknown>,
): Promise<QueryResponse[]> {
	try {
		const results: QueryResponse[] = [];
		const queryResponses: Map<number, any> = new Map();
		const stream = instance.query(query, bindings).stream();

		for await (const frame of stream) {
			if (frame.isValue<any>()) {
				if (frame.isSingle) {
					queryResponses.set(frame.query, frame.value);
				} else {
					let queryResults = queryResponses.get(frame.query);

					if (!queryResults) {
						queryResults = [];
						queryResponses.set(frame.query, queryResults);
					}

					queryResults.push(frame.value);
				}
			} else if (frame.isDone()) {
				const result = queryResponses.has(frame.query)
					? queryResponses.get(frame.query)
					: undefined;

				results.push({
					success: true,
					duration: frame.stats?.duration,
					type: frame.type,
					result,
				});
			} else if (frame.isError()) {
				results.push({
					success: false,
					result: frame.error.message,
					duration: frame.stats?.duration,
				});
			}
		}

		return results;
	} catch (err: any) {
		return [
			{
				success: false,
				result: typeof err === "string" ? err : err.message,
			},
		];
	}
}

/**
 * Execute a query against the active connection and
 * return the first response
 */
export async function executeQueryFirst(query: string, bindings?: Record<string, unknown>) {
	const results = await executeQuery(query, bindings);
	const { success, result } = results[0];

	if (success) {
		return result;
	}

	throw new Error(result);
}

/**
 * Execute a query against the active connection and
 * return the first record of the first response
 */
export async function executeQuerySingle<T = any>(
	query: string,
	bindings?: Record<string, unknown>,
): Promise<T> {
	const results = await executeQuery(query, bindings);
	const { success, result } = results[0];

	if (success) {
		return Array.isArray(result) ? result[0] : result;
	}

	throw new Error(result);
}

/**
 * Execute a query against the active connection
 *
 * @param options Query options
 */
export async function executeUserQuery(options?: UserQueryOptions) {
	const { setIsLive, pushLiveQueryMessage, clearLiveQueryMessages } =
		useInterfaceStore.getState();
	const { setQueryActive, currentState, setQueryResponse } = useDatabaseStore.getState();
	const { addHistoryEntry } = useConfigStore.getState();
	const connection = getConnection();

	if (!connection || currentState !== "connected") {
		showErrorNotification({
			title: "Failed to execute",
			content: "You must be connected to the remote instance",
		});
		return;
	}

	const tabQuery = connection.queries.find((q) => q.id === connection.activeQuery);

	if (!tabQuery) {
		return;
	}

	const { id, variables, name } = tabQuery;

	const query = getQueryOr(id, options?.override).trim();

	if (query.length === 0) {
		return;
	}

	try {
		setQueryActive(true);

		let liveIndexes: number[];

		const variablesObject = await getSurrealQL().parseValue<Record<string, unknown>>(variables);
		const response = await executeQuery(query, variablesObject);

		try {
			liveIndexes = await getSurrealQL().getLiveQueries(query, response);
		} catch (err: any) {
			adapter.warn("DB", `Failed to parse live queries: ${err.message}`);
			liveIndexes = [];
		}

		if (liveIndexes.length > 0 && !LQ_SUPPORTED.has(connection.authentication.protocol)) {
			showErrorNotification({
				title: "Live queries unsupported",
				content:
					"Unfortunately live queries are not supported in the active connection protocol",
			});
		}

		const liveIds = liveIndexes.flatMap((idx) => {
			const res = response[idx];

			if (!res.success || !(res.result instanceof Uuid)) {
				return [];
			}

			return [res.result];
		});

		cancelLiveQueries(id);
		clearLiveQueryMessages(id);
		setIsLive(id, liveIds.length > 0);

		LIVE_QUERIES.set(id, new Set(liveIds));

		for (const queryId of liveIds) {
			const subscription = await instance.liveOf(queryId);

			subscription.subscribe(({ action, value }) => {
				pushLiveQueryMessage(id, {
					id: newId(),
					queryId: queryId.toString(),
					action,
					data: value,
					timestamp: Date.now(),
				});
			});
		}

		setQueryResponse(id, response);

		const compute_time = response
			.map(({ duration }) => (duration?.seconds ? Number(duration.seconds) : 0))
			.reduce((a, b) => a + b, 0);

		tagEvent("query_execute", {
			protocol: connection.authentication.protocol.toString(),
			type: "surql",
			compute_time: compute_time,
		});

		if (query.length <= MAX_HISTORY_QUERY_LENGTH) {
			addHistoryEntry(connection.id, {
				id: newId(),
				query: query,
				timestamp: Date.now(),
				origin: name,
			});
		}
	} catch (err: any) {
		showErrorNotification({
			title: "Failed to execute",
			content: err,
		});
	} finally {
		setQueryActive(false);
	}
}

function getQueryOr(id: string, override?: string) {
	if (override) {
		return override;
	}

	return useQueryStore.getState().queryState[id]?.doc ?? "";
}

function isGraphqlSupportedError(err: string) {
	return (
		err.includes("Method not found") ||
		err.includes("A GraphQL request was made, but GraphQL is not supported by the context")
	);
}

/**
 * Check whether the active connection supports GraphQL
 */
export async function checkGraphqlSupport() {
	try {
		const res = await sendGraphqlRequest("");
		const someError = res.errors?.some((err: any) => isGraphqlSupportedError(err.message));

		return !!res.errors && !someError;
	} catch (err: any) {
		return !isGraphqlSupportedError(err.message);
	}
}

/**
 * Send a raw GraphQL request to the active connection
 */
export async function sendGraphqlRequest(
	query: string,
	params?: Record<string, any>,
	operation?: string,
) {
	try {
		const start = performance.now();
		const connection = getConnection();

		const { currentState } = useDatabaseStore.getState();

		if (!connection || currentState !== "connected") {
			throw new Error("Not connected to an instance");
		}

		const { endpoint, headers } = composeHttpConnection(connection.authentication, "/graphql");

		const response = await fetch(endpoint, {
			headers,
			method: "POST",
			body: JSON.stringify({
				query,
				variables: params,
				operationName: operation,
			}),
		});

		const result: GraphqlResponse = await response.json();
		const end = performance.now();

		return {
			success: !!response.ok && !result.errors,
			result: result.result.data,
			errors: result.errors,
			execution_time: `${(end - start).toFixed(2)}ms`,
		};
	} catch (err: any) {
		return {
			success: false,
			result: null,
			errors: err.message,
			execution_time: "",
		};
	}
}

/**
 * Execute a GraphQL query against the active connection
 */
export async function executeGraphql(
	query: string,
	params?: Record<string, any>,
	operation?: string,
) {
	const { currentState, setGraphqlQueryActive, setGraphqlResponse } = useDatabaseStore.getState();
	const connection = getConnection();

	if (!connection || currentState !== "connected") {
		showErrorNotification({
			title: "Failed to execute",
			content: "You must be connected to the remote instance",
		});

		throw new Error("Not connected");
	}

	setGraphqlQueryActive(true);

	try {
		const response = await sendGraphqlRequest(query, params, operation);

		setGraphqlResponse(connection.id, response);

		tagEvent("query_execute", {
			protocol: connection.authentication.protocol.toString(),
			type: "graphql",
			compute_time: surqlDurationToSeconds(response.execution_time),
		});
	} catch (err: any) {
		console.warn("executeGraphql fail", err);

		return {
			success: false,
			result: err.message,
		};
	} finally {
		setGraphqlQueryActive(false);
	}
}

/**
 * Cancel the active live queries for the given query ID
 */
export function cancelLiveQueries(tab: string) {
	const { setIsLive } = useInterfaceStore.getState();

	for (const id of LIVE_QUERIES.get(tab) || []) {
		instance.liveOf(id).then((live) => {
			live.kill();
		});
	}

	setIsLive(tab, false);
}

/**
 * Activate the given database within the specified namespace
 */
export async function activateDatabase(namespace: string, database: string) {
	const { updateConnection } = useConfigStore.getState();
	const connection = getActiveConnection();
	let invalidNS = false;

	if (!connection) {
		return;
	}

	// Select a namespace only
	if (namespace) {
		const isValid = await isNamespaceValid(namespace);

		if (isValid) {
			updateConnection({
				id: connection,
				lastNamespace: namespace,
				lastDatabase: database,
			});

			await instance.use({
				namespace,
				database: null,
			});
		} else {
			invalidNS = true;

			updateConnection({
				id: connection,
				lastNamespace: "",
				lastDatabase: "",
			});
		}
	} else {
		updateConnection({
			id: connection,
			lastNamespace: "",
			lastDatabase: "",
		});
	}

	// Select a database
	if (!invalidNS && namespace && database) {
		const isValid = await isDatabaseValid(database);

		if (isValid) {
			updateConnection({
				id: connection,
				lastDatabase: database,
			});

			await instance.use({ database });
		} else {
			updateConnection({
				id: connection,
				lastDatabase: "",
			});
		}
	}

	try {
		ActivateDatabaseEvent.dispatch(null);

		await syncConnectionSchema({
			clearDatabase: true,
		});
	} catch (err: any) {
		showErrorNotification({
			title: "Failed to parse schema",
			content: err,
		});
	}
}

/**
 * Request a database export from the remote connection
 *
 * @param config The export configuration
 */
export async function requestDatabaseExport(config?: SqlExportOptions) {
	const { currentState, version } = useDatabaseStore.getState();
	const connection = getConnection();
	const useModern = compareVersions(version, "2.1.0");

	if (!connection || currentState !== "connected") {
		throw new Error("Not connected to an instance");
	}

	if (useModern) {
		return new Blob([await instance.export(config)]);
	}

	const { endpoint, headers } = composeHttpConnection(connection.authentication, "/export");

	const response = await fetch(endpoint, {
		headers,
		method: "GET",
	});

	return await response.blob();
}

/**
 * Reset the current connection, which includes re-connecting and resetting
 * any temporary state.
 */
export function resetConnection() {
	const { clearQueryResponse, clearGraphqlResponse } = useDatabaseStore.getState();
	const connection = getConnection();

	openConnection();

	if (connection) {
		for (const query of connection.queries) {
			clearQueryResponse(query.id);
		}

		clearGraphqlResponse(connection.id);
	}
}

/**
 * Compose HTTP authentication headers
 */
export function composeHttpConnection(
	authentication: Authentication,
	path: string,
	extraHeaders?: Record<string, string>,
) {
	const { protocol, hostname } = authentication;

	const isSecure = protocol === "https" || protocol === "wss";
	const endpoint = new URL(path, `${isSecure ? "https" : "http"}://${hostname}`).toString();

	const headers: Record<string, string> = {
		...extraHeaders,
		Authorization: `Bearer ${authentication.token}`,
	};

	if (authentication.namespace) {
		headers["Surreal-NS"] = authentication.namespace;
	}

	if (authentication.database) {
		headers["Surreal-DB"] = authentication.database;
	}

	return { endpoint, headers };
}

/**
 * The connection instance currently in use
 */
export function getOpenConnection() {
	return openedConnection;
}

/**
 * Get the surreal instance
 */
export function getSurreal() {
	return instance;
}

/**
 * Schedule a reconnect attempt
 */
function scheduleReconnect(timeout: number) {
	retryTask = setTimeout(() => {
		const { currentState } = useDatabaseStore.getState();
		const connection = getConnection();

		if (currentState !== "connected" && connection) {
			openConnection({
				connection,
				isRetry: true,
			});
		}
	}, timeout);
}

/**
 * Extract tokens or system users from the given authentication details
 */
function extractManagedAuth(authDetails: AuthDetails): string | SystemAuth | Token | undefined {
	if (typeof authDetails === "string") {
		return authDetails;
	}

	if (authDetails && !("access" in authDetails)) {
		return authDetails;
	}

	return undefined;
}

/**
 * Extract access authentication details from the given authentication details
 */
function extractAccessAuth(authDetails: AuthDetails): AccessAuth | undefined {
	if (authDetails && typeof authDetails === "object" && "access" in authDetails) {
		return authDetails;
	}

	return undefined;
}

async function isNamespaceValid(namespace: string) {
	try {
		const [result] = await instance.query("INFO FOR KV").collect<[SchemaInfoKV]>();
		const namespaces = Object.keys(result?.namespaces ?? {}).map((ns) => parseIdent(ns));

		return namespaces.includes(namespace);
	} catch {
		return true;
	}
}

async function isDatabaseValid(database: string) {
	try {
		const [result] = await instance.query("INFO FOR NS").collect<[SchemaInfoNS]>();
		const databases = Object.keys(result?.databases ?? {}).map((db) => parseIdent(db));

		return databases.includes(database);
	} catch {
		return true;
	}
}

export function hasSurrealQL() {
	return surrealql !== null;
}

export function getSurrealQL() {
	return surrealql ?? __throw("No SurrealQL instance available");
}
