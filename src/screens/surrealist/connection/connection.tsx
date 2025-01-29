import {
	type AccessRecordAuth,
	type ExportOptions,
	QueryParameters,
	type ScopeAuth,
	type Surreal,
	SurrealDbError,
	UnsupportedVersion,
	Uuid,
	VersionRetrievalFailure,
	decodeCbor,
} from "surrealdb";

import {
	buildAccessAuth,
	buildScopeAuth,
	composeAuthentication,
	getReconnectInterval,
	getVersionTimeout,
	mapResults,
} from "./helpers";

import { Value } from "@surrealdb/ql-wasm";
import { compareVersions } from "compare-versions";
import { adapter } from "~/adapter";
import { MAX_HISTORY_QUERY_LENGTH, SANDBOX } from "~/constants";
import { useCloudStore } from "~/stores/cloud";
import { useConfigStore } from "~/stores/config";
import { type State, useDatabaseStore } from "~/stores/database";
import { useInterfaceStore } from "~/stores/interface";
import { useQueryStore } from "~/stores/query";
import type { AuthDetails, Authentication, Connection, Protocol } from "~/types";
import { getActiveConnection, getAuthDB, getAuthNS, getConnection } from "~/util/connection";
import { CloudError } from "~/util/errors";
import { ConnectedEvent, DisconnectedEvent } from "~/util/global-events";
import { connectionUri, newId, showError, showWarning } from "~/util/helpers";
import { captureMetric } from "~/util/metrics";
import { syncConnectionSchema } from "~/util/schema";
import { getLiveQueries, parseIdent } from "~/util/surrealql";
import { createPlaceholder, createSurreal } from "./surreal";

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
}

let openedConnection: Connection;
let instance = createPlaceholder();
let accessToken = "";
let hasFailed = false;
let forceClose = false;
let retryTask: any;

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

	const isRetry = hasFailed && options?.isRetry;
	const newState = isRetry ? "retrying" : "connecting";
	const surreal = await createSurreal();

	await closeConnection(newState);

	instance = surreal;
	openedConnection = connection;
	forceClose = false;

	const { setCurrentState, setVersion, setLatestError, clearSchema } =
		useDatabaseStore.getState();
	const rpcEndpoint = connectionUri(connection.authentication);
	const thisInstance = instance;

	clearSchema();

	adapter.log("DB", `Opening connection to ${rpcEndpoint}`);

	if (retryTask) {
		clearTimeout(retryTask);
		retryTask = undefined;
	}

	instance.emitter.subscribe("disconnected", () => {
		DisconnectedEvent.dispatch(null);

		if (instance === thisInstance) {
			setCurrentState(forceClose ? "disconnected" : "retrying");
			setVersion("");
		}

		if (!forceClose) {
			scheduleReconnect();
		}
	});

	instance.emitter.subscribe("error", (err) => {
		if (instance === thisInstance) {
			setLatestError(err.message);
			console.dir(err);
		}
	});

	try {
		const isScopeSignup = connection.authentication.mode === "scope-signup";
		const isAccessSignup = connection.authentication.mode === "access-signup";
		const [versionCheck, versionCheckTimeout] = getVersionTimeout();

		if (connection.authentication.mode === "cloud") {
			const { authState } = useCloudStore.getState();

			if (authState === "loading" || authState === "unknown") {
				scheduleReconnect(1000);
				return;
			}

			if (authState === "unauthenticated") {
				throw new CloudError("Not authenticated with Surreal Cloud");
			}
		}

		const namespace = getAuthNS(connection.authentication) || connection.lastNamespace;
		const database = getAuthDB(connection.authentication) || connection.lastDatabase;

		await instance.connect(rpcEndpoint, {
			versionCheck,
			versionCheckTimeout,
			prepare: async (surreal) => {
				try {
					const auth = await composeAuthentication(connection.authentication);

					if (isAccessSignup) {
						await register(buildAccessAuth(connection.authentication), surreal);
					} else if (isScopeSignup) {
						await register(buildScopeAuth(connection.authentication), surreal);
					} else {
						await authenticate(auth, surreal);
					}
				} catch (err) {
					throw new Error(`Authentication failed: ${err}`);
				}
			},
		});

		if (instance === thisInstance) {
			captureMetric("connection_open", {
				protocol: connection.authentication.protocol,
			});

			adapter.log("DB", "Connection established");

			instance.version().then((v) => {
				const version = v.replace(/^surrealdb-/, "");

				setVersion(version);
				adapter.log("DB", `Database version ${version ?? "unknown"}`);
			});

			hasFailed = false;

			setCurrentState("connected");
			setLatestError("");

			if (connection.id === SANDBOX) {
				await instance.use({
					namespace: "sandbox",
					database: "sandbox",
				});
			} else {
				await activateDatabase(namespace, database);
			}

			ConnectedEvent.dispatch(null);
		}
	} catch (err: any) {
		if (instance === thisInstance) {
			instance.close();

			setLatestError(err.message);

			if (!hasFailed) {
				if (err instanceof VersionRetrievalFailure) {
					showWarning({
						title: "Failed to query version",
						subtitle:
							"The database version could not be determined. Please ensure the database is running and accessible by Surrealist.",
					});
				} else if (err instanceof UnsupportedVersion) {
					showError({
						title: "Unsupported version",
						subtitle: `The database version must be in range "${err.supportedRange}". The current version is ${err.version}`,
					});
				} else if (!(err instanceof CloudError)) {
					console.error(err);
					showError({
						title: "Connection failed",
						subtitle: err.message,
					});
				}
			}

			hasFailed = true;
		}
	}
}

/**
 * Returns whether the connection is considered active
 */
export function isConnected() {
	return instance.status === "connected" || instance.status === "connecting";
}

/**
 * Close the active surreal connection
 *
 * @param state The state to set after closing
 */
export async function closeConnection(state?: State) {
	const { setCurrentState, setVersion } = useDatabaseStore.getState();
	const status = instance.status;

	if (status === "connected" || status === "connecting") {
		forceClose = true;
		instance.close();
	}

	setCurrentState(state ?? "disconnected");
	setVersion("");
}

/**
 * Register a new scope user
 *
 * @param auth The authentication details
 * @param surreal The optional surreal instance
 */
export async function register(auth: ScopeAuth | AccessRecordAuth, surreal?: Surreal) {
	const db = surreal ?? instance;

	await db
		.signup(auth)
		.then((t) => {
			accessToken = t;
		})
		.catch(() => {
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
		accessToken = "";
		await db.invalidate();
	} else if (typeof auth === "string") {
		accessToken = auth;
		await db.authenticate(auth).catch(() => {
			throw new Error("Authentication token invalid");
		});
	} else if (auth) {
		await db
			.signin(auth)
			.then((t) => {
				accessToken = t;
			})
			.catch((err) => {
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
export async function executeQuery(...args: QueryParameters) {
	try {
		const responseRaw = (await instance.queryRaw(...args)) || [];

		return mapResults(responseRaw);
	} catch (err: any) {
		if (err instanceof SurrealDbError) {
			console.warn("executeQuery fail", err);
		}

		return [
			{
				success: false,
				result: err.message,
				execution_time: "",
			},
		];
	}
}

/**
 * Execute a query against the active connection and
 * return the first response
 */
export async function executeQueryFirst(query: string) {
	const results = await executeQuery(query);
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
export async function executeQuerySingle<T = any>(query: string): Promise<T> {
	const results = await executeQuery(query);
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
		showError({
			title: "Failed to execute",
			subtitle: "You must be connected to the remote instance",
		});
		return;
	}

	const tabQuery = connection.queries.find((q) => q.id === connection.activeQuery);

	if (!tabQuery) {
		return;
	}

	const { id, variables, name } = tabQuery;

	const query = getQueryOr(id, options?.override).trim();
	const variableJson = variables
		? decodeCbor(Value.from_string(variables).to_cbor().buffer)
		: undefined;

	if (query.length === 0) {
		return;
	}

	try {
		setQueryActive(true);

		let liveIndexes: number[];

		try {
			liveIndexes = getLiveQueries(query);
		} catch (err: any) {
			adapter.warn("DB", `Failed to parse live queries: ${err.message}`);
			console.error(err);
			liveIndexes = [];
		}

		if (liveIndexes.length > 0 && !LQ_SUPPORTED.has(connection.authentication.protocol)) {
			showError({
				title: "Live queries unsupported",
				subtitle:
					"Unfortunately live queries are not supported in the active connection protocol",
			});
		}

		const response = (await executeQuery(query, variableJson)) || [];
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
			instance.subscribeLive(queryId, (action, data) => {
				pushLiveQueryMessage(id, {
					id: newId(),
					queryId: queryId.toString(),
					action,
					data,
					timestamp: Date.now(),
				});
			});
		}

		setQueryResponse(id, response);
		captureMetric("query_execute");

		if (query.length <= MAX_HISTORY_QUERY_LENGTH) {
			addHistoryEntry({
				id: newId(),
				query: query,
				timestamp: Date.now(),
				origin: name,
			});
		}
	} catch (err: any) {
		if (err instanceof SurrealDbError) {
			console.warn("executeUserQuery fail", err);
		}
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
		const res = await instance.graphql({});

		return !!res.error && !isGraphqlSupportedError(res.error.message);
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
		const { result, error } = await instance.graphql({
			query,
			variables: params,
			operationName: operation,
		});

		return {
			success: !!result,
			result: result || error,
		};
	} catch (err: any) {
		return {
			success: false,
			result: err.message,
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
		showError({
			title: "Failed to execute",
			subtitle: "You must be connected to the remote instance",
		});

		throw new Error("Not connected");
	}

	setGraphqlQueryActive(true);

	try {
		const response = await sendGraphqlRequest(query, params, operation);

		setGraphqlResponse(connection.id, response);
		captureMetric("graphql_execute");
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
		instance.kill(id);
	}

	setIsLive(tab, false);
}

/**
 * Activate the given database within the specified namespace
 */
export async function activateDatabase(namespace: string, database: string) {
	const { updateCurrentConnection } = useConfigStore.getState();

	// Select a namespace only
	if (namespace) {
		const isValid = await isNamespaceValid(namespace);

		if (isValid) {
			updateCurrentConnection({
				lastNamespace: namespace,
				lastDatabase: database,
			});

			await instance.use({
				namespace,
				database: null,
			});
		} else {
			updateCurrentConnection({
				lastNamespace: "",
				lastDatabase: "",
			});

			return;
		}
	} else {
		updateCurrentConnection({
			lastNamespace: "",
			lastDatabase: "",
		});
	}

	// Select a database
	if (namespace && database) {
		const isValid = await isDatabaseValid(database);

		if (isValid) {
			updateCurrentConnection({
				lastDatabase: database,
			});

			await instance.use({ database });
		} else {
			updateCurrentConnection({
				lastDatabase: "",
			});
		}
	}

	try {
		await syncConnectionSchema();
	} catch (err: any) {
		showError({
			title: "Failed to parse schema",
			subtitle: err.message,
		});
	}
}

/**
 * Request a database export from the remote connection
 *
 * @param config The export configuration
 */
export async function requestDatabaseExport(config?: ExportOptions) {
	const { currentState, version } = useDatabaseStore.getState();
	const connection = getConnection();
	const useModern = compareVersions(version, "2.1.0");

	if (!connection || currentState !== "connected") {
		throw new Error("Not connected to an instance");
	}

	if (useModern) {
		return new Blob([await instance.export(config)]);
	}

	const { endpoint, headers } = composeHttpConnection(
		connection.authentication,
		connection.lastNamespace,
		connection.lastDatabase,
		"/export",
	);

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
	namespace: string,
	database: string,
	path: string,
	extraHeaders?: Record<string, string>,
) {
	if (!accessToken) {
		throw new Error("No access token available");
	}

	const { protocol, hostname } = authentication;

	const isSecure = protocol === "https" || protocol === "wss";
	const endpoint = new URL(path, `${isSecure ? "https" : "http"}://${hostname}`).toString();

	const headers: Record<string, string> = {
		...extraHeaders,
		Authorization: `Bearer ${accessToken}`,
	};

	if (namespace) {
		headers["Surreal-NS"] = namespace;
	}

	if (database) {
		headers["Surreal-DB"] = database;
	}

	return { endpoint, headers };
}

/**
 * The connection instance currently in use
 */
export function getOpenConnection() {
	return openedConnection;
}

function scheduleReconnect(timeout?: number) {
	const reconnectInterval = getReconnectInterval();
	const delay = timeout ?? reconnectInterval;

	retryTask = setTimeout(() => {
		const { currentState } = useDatabaseStore.getState();

		if (currentState !== "connected") {
			openConnection({
				connection: getActiveConnection(),
				isRetry: true,
			});
		}
	}, delay);
}

async function isNamespaceValid(namespace: string) {
	try {
		const result = await executeQuerySingle("INFO FOR KV");
		const namespaces = Object.keys(result?.namespaces ?? {}).map((ns) => parseIdent(ns));

		return namespaces.includes(namespace);
	} catch {
		return true;
	}
}

async function isDatabaseValid(database: string) {
	try {
		const result = await executeQuerySingle("INFO FOR NS");
		const databases = Object.keys(result?.databases ?? {}).map((db) => parseIdent(db));

		return databases.includes(database);
	} catch {
		return true;
	}
}
