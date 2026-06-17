import { compareVersions } from "compare-versions";
import {
	type AccessRecordAuth,
	Features,
	ProvidedAuth,
	SqlExportOptions,
	Surreal,
	SystemAuth,
	UnsupportedVersionError,
	Uuid,
} from "surrealdb";
import { adapter } from "~/adapter";
import { fetchAPI } from "~/cloud/api";
import { LQ_SUPPORTED, MAX_HISTORY_QUERY_LENGTH, SANDBOX } from "~/constants";
import { hasCompletedOnboarding } from "~/hooks/onboarding";
import { getCloudSessionStatus } from "~/providers/Cloud";
import { useConfigStore } from "~/stores/config";
import { State, useDatabaseStore } from "~/stores/database";
import { useInterfaceStore } from "~/stores/interface";
import { useQueryStore } from "~/stores/query";
import type {
	Authentication,
	CloudInstance,
	Connection,
	QueryResponse,
	SchemaInfoKV,
	SchemaInfoNS,
} from "~/types";
import { tagEvent } from "~/util/analytics";
import { getSetting } from "~/util/config";
import {
	getActiveConnection,
	getAuthDB,
	getAuthNS,
	getConnection,
	getConnectionVariant,
} from "~/util/connection";
import { appendQueriesToConnection, loadDatasetSampleQueries } from "~/util/datasets";
import { surqlDurationToSeconds } from "~/util/duration";
import { CloudError } from "~/util/errors";
import { ActivateDatabaseEvent, ConnectedEvent, DisconnectedEvent } from "~/util/global-events";
import {
	__throw,
	connectionUri,
	exposeDebug,
	newId,
	showErrorNotification,
	showWarning,
} from "~/util/helpers";
import { countQueryStatements, parseIdent } from "~/util/language";
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

const LIVE_QUERIES = new Map<string, Set<Uuid>>();

/**
 * Open a new connection to the data
 *
 * @param options Connection options
 */
export async function openConnection(options?: ConnectOptions) {
	const params = new URLSearchParams(location.search);
	const currentConnection = getConnection();
	const hasCompletedSandboxOnboarding = hasCompletedOnboarding("sandbox");
	const connection = options?.connection || currentConnection;

	if (!connection) {
		throw new Error("No connection available");
	}

	// FIXME currently unused due to defaults
	const _strictSandbox = getSetting("behavior", "strictSandbox");
	const newState = options?.isRetry ? "retrying" : "connecting";
	const surreal = await createSurreal();

	await _closeConnection(newState, false);

	instance = surreal;
	openedConnection = connection;

	exposeDebug({ surreal, surrealql });

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

	try {
		const [versionCheck] = getVersionTimeout();

		if (connection.authentication.mode === "cloud") {
			const { isActive } = getCloudSessionStatus();

			// Wait for the cloud session to become active. `useConnectionSwitch`
			// observes cloud state and will re-trigger this flow when it does;
			// the scheduled retry acts as a safety net for non-reactive callers.
			if (!isActive) {
				scheduleReconnect(1000);
				return;
			}

			const instance = await fetchAPI<CloudInstance>(
				`/instances/${connection.authentication.cloudInstance}`,
			);

			if (!instance || instance.state !== "ready") {
				scheduleReconnect(1000);
				return;
			}
		}

		const namespace = getAuthNS(connection.authentication) || connection.lastNamespace;
		const database = getAuthDB(connection.authentication) || connection.lastDatabase;

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
			console.error(err);
		});

		try {
			await instance.connect(rpcEndpoint, {
				versionCheck,
				reconnect: {
					enabled: true,
					attempts: -1,
					retryDelayMultiplier: 1.2,
					retryDelayJitter: 0,
				},
				authentication: async () => {
					const credentials = await composeAuthentication(connection.authentication);

					if (credentials) {
						return credentials as string | SystemAuth;
					}

					return null;
				},
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
			await instance.use();

			if (!hasCompletedSandboxOnboarding && adapter.isSampleSandboxEnabled) {
				const queries = await loadDatasetSampleQueries("surreal-start", version);

				if (queries.length > 0) {
					appendQueriesToConnection(
						queries,
						queries.map((query) => query.name),
					);
				}

				params.delete("queries");
			}
		} else {
			await activateDatabase(namespace, database);
		}

		ConnectedEvent.dispatch(null);

		void tagEvent("connection_connected", {
			protocol: connection.authentication.protocol.toString(),
			variant: getConnectionVariant(connection),
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
export async function authenticate(auth: ProvidedAuth, surreal?: Surreal) {
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

export async function executeQuery(
	query: string,
	bindings?: Record<string, unknown>,
): Promise<QueryResponse[]> {
	try {
		const resultsByQuery = new Map<number, QueryResponse>();
		const queryValues = new Map<number, any>();
		let maxQueryIndex = -1;
		const stream = instance.query(query, bindings).stream();

		for await (const frame of stream) {
			const queryIndex = frame.query;
			maxQueryIndex = Math.max(maxQueryIndex, queryIndex);

			if (frame.isValue<any>()) {
				if (frame.isSingle) {
					queryValues.set(queryIndex, frame.value);
				} else {
					let queryResults = queryValues.get(queryIndex);

					if (!queryResults) {
						queryResults = [];
						queryValues.set(queryIndex, queryResults);
					}

					queryResults.push(frame.value);
				}
			} else if (frame.isDone()) {
				const result = queryValues.has(queryIndex) ? queryValues.get(queryIndex) : [];

				resultsByQuery.set(queryIndex, {
					success: true,
					duration: frame.stats?.duration,
					type: frame.type,
					result,
				});
			} else if (frame.isError()) {
				resultsByQuery.set(queryIndex, {
					success: false,
					result: frame.error.message,
					duration: frame.stats?.duration,
				});
			}
		}

		if (maxQueryIndex === -1) {
			return [];
		}

		const results: QueryResponse[] = [];

		for (let i = 0; i <= maxQueryIndex; i++) {
			results.push(
				resultsByQuery.get(i) ?? {
					success: false,
					result: "Query did not return a response",
				},
			);
		}

		return results;
	} catch (err: any) {
		const errorResponse: QueryResponse = {
			success: false,
			result: typeof err === "string" ? err : err.message,
		};

		return Array.from({ length: countQueryStatements(query) }, () => errorResponse);
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

	const queryValue = getQueryOr(id, options?.override);
	const query = (typeof queryValue === "string" ? queryValue : "").trim();

	if (query.length === 0) {
		return;
	}

	try {
		setQueryActive(id, true);

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

		void tagEvent("query_execute", {
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
		setQueryActive(id, false);
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

		void tagEvent("query_execute", {
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
	const { setIsSyncingSchema } = useDatabaseStore.getState();
	const connection = getActiveConnection();
	let invalidNS = false;

	if (!connection) {
		return;
	}

	setIsSyncingSchema(true);

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

	// Select the default namespace and database
	if (invalidNS || !namespace) {
		const { namespace, database } = await instance.use({});

		updateConnection({
			id: connection,
			lastNamespace: namespace,
			lastDatabase: database,
		});
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
export async function requestDatabaseExport(config?: Partial<SqlExportOptions>): Promise<Response> {
	const { currentState, version } = useDatabaseStore.getState();
	const connection = getConnection();
	const useModern = compareVersions(version, "2.1.0");

	if (!connection || currentState !== "connected") {
		throw new Error("Not connected to an instance");
	}

	if (useModern) {
		if (instance.isFeatureSupported(Features.ExportImportRaw)) {
			return instance.export(config).raw();
		} else {
			return new Response(await instance.export(config));
		}
	}

	const { endpoint, headers } = composeHttpConnection(connection.authentication, "/export");

	return fetch(endpoint, {
		headers,
		method: "GET",
	});
}

export type StreamingSupport = "unsupported-browser" | "unsupported-engine" | "supported";

/**
 * Returns whether streaming imports or exports are supported
 */
export function isStreamingSupported() {
	const surreal = getSurreal();

	if (!("showSaveFilePicker" in window) || !("showOpenFilePicker" in window)) {
		return "unsupported-browser";
	}

	if (!surreal.isConnected || !surreal.isFeatureSupported(Features.ExportImportRaw)) {
		return "unsupported-engine";
	}

	return "supported";
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

	// Prefer the access token held by the live connection. The configured
	// `token` is only populated for token authentication, so signing in with
	// any other method would otherwise leave these raw HTTP requests (GraphQL,
	// export, ML import) unauthenticated.
	const token = instance.accessToken ?? authentication.token;

	const headers: Record<string, string> = {
		...extraHeaders,
		Authorization: `Bearer ${token}`,
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

async function isNamespaceValid(namespace: string) {
	const connection = getConnection();
	const authNS = connection && getAuthNS(connection.authentication);

	if (authNS === namespace) {
		return true;
	}

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
