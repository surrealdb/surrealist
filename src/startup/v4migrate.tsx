/**
 * Hands this deployment's stored configuration to the next major version of
 * Surrealist, so a returning user's connections, queries and preferences carry
 * over instead of being retyped.
 *
 * The next version is served from a different origin, and browser storage is
 * origin-scoped, so it cannot read this one's IndexedDB directly. It embeds this
 * page instead and asks for the configuration over `postMessage`.
 *
 * Deliberately standalone: no React, no imports from `~`. The page exists to
 * answer one question as cheaply as possible, and pulling in the application's
 * modules would also pull in their side effects - `~/util/idxdb` opens the
 * configuration database at module scope, which would *create* it for a user who
 * has never used Surrealist in a browser.
 *
 * The configuration includes connection credentials in plain text, so the origin
 * check below is the whole security model. Read it before changing anything here.
 */

/** The database Surrealist keeps its browser configuration in. */
const DATABASE = "surrealist";
const STORE = "store";
const CONFIG_KEY = "surrealist:config";

/** The domain whose deployments may ask for a configuration. */
const COMPANY_DOMAIN = "surrealdb.com";

/** Shared with the embedder. Both halves must agree, so both are checked. */
const CHANNEL = "surrealist-config-transfer";
const VERSION = 1;

/** How long to wait for a request before giving up and going quiet. */
const REQUEST_TIMEOUT = 15_000;

interface TransferRequest {
	nonce: string;
}

type ReadResult =
	| { status: "found"; json: string }
	| { status: "empty" }
	| { status: "error"; reason: string };

/** Requests already answered, so a repeated one cannot force a second read. */
const answered = new Set<string>();

/**
 * Whether an origin belongs to a deployment allowed to ask for a configuration.
 *
 * Matched on the *parsed hostname*, never on the origin string. A string
 * comparison is defeated by a port, and a suffix test against the raw origin
 * would happily accept `https://app.surrealdb.com.example.com`.
 *
 * This must stay an exact hostname or an exact subdomain of our own domain.
 * Widening it to a wildcard, or letting a query parameter nominate the origin,
 * would let any page on the internet read the visitor's saved database
 * credentials out of this browser.
 */
function isTrustedRequester(origin: string): boolean {
	let url: URL;

	try {
		url = new URL(origin);
	} catch {
		return false;
	}

	if (url.protocol === "https:") {
		return url.hostname === COMPANY_DOMAIN || url.hostname.endsWith(`.${COMPANY_DOMAIN}`);
	}

	// A local development server, so the flow can be exercised without deploying
	// anything. Compiled out of a published build.
	return import.meta.env.DEV && url.protocol === "http:" && url.hostname === "localhost";
}

/** The request within a message, or `null` if this is not one of ours. */
function readRequest(event: MessageEvent): TransferRequest | null {
	const data = event.data;

	if (typeof data !== "object" || data === null) {
		return null;
	}

	const message = data as Record<string, unknown>;

	if (message.channel !== CHANNEL || message.version !== VERSION) {
		return null;
	}

	if (message.type !== "request" || typeof message.nonce !== "string") {
		return null;
	}

	// Only the embedder may ask. Anything else with a handle on this window - an
	// opener, a sibling frame - is not who this page is for.
	if (window.parent === window || event.source !== window.parent) {
		return null;
	}

	return { nonce: message.nonce };
}

/**
 * Whether the configuration database exists, or `null` where that cannot be
 * established without creating it.
 */
async function databaseExists(): Promise<boolean | null> {
	if (typeof indexedDB.databases !== "function") {
		return null;
	}

	const databases = await indexedDB.databases();

	return databases.some((entry) => entry.name === DATABASE);
}

/**
 * Open the configuration database, or resolve `null` when there was none.
 *
 * Opened without a version so an existing database opens exactly as it is and no
 * upgrade runs. A database that does not exist is *created* by this call, which is
 * what `onupgradeneeded` reports here - so the empty database that was just made
 * is removed again rather than left behind on a browser that never had one.
 */
function openExistingDatabase(): Promise<IDBDatabase | null> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DATABASE);
		let created = false;

		request.onupgradeneeded = () => {
			created = true;
		};

		request.onsuccess = () => {
			const database = request.result;

			if (created || !database.objectStoreNames.contains(STORE)) {
				database.close();
				indexedDB.deleteDatabase(DATABASE);
				resolve(null);
				return;
			}

			resolve(database);
		};

		request.onerror = () => reject(request.error);
	});
}

/** Read the stored configuration out of an open database. */
function readStoredConfig(database: IDBDatabase): Promise<unknown> {
	return new Promise((resolve, reject) => {
		const request = database.transaction(STORE, "readonly").objectStore(STORE).get(CONFIG_KEY);

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

/**
 * Read the configuration this browser has stored.
 *
 * IndexedDB only. Surrealist once kept its configuration in local storage and
 * still reads that on startup for anyone who has not opened it since; that path
 * is deliberately not followed here, so only the current store is offered.
 *
 * Storage that refuses to answer - private browsing, blocked storage - is an
 * error rather than an absence. The two are acted on differently by the caller,
 * and reporting "nothing stored" for a browser that would not look is how a
 * configuration silently goes missing.
 */
async function readConfig(): Promise<ReadResult> {
	try {
		if ((await databaseExists()) === false) {
			return { status: "empty" };
		}

		const database = await openExistingDatabase();

		if (!database) {
			return { status: "empty" };
		}

		try {
			const config = await readStoredConfig(database);

			if (config === undefined || config === null) {
				return { status: "empty" };
			}

			// Serialised here rather than passed as-is: the receiving version stores
			// this in a different shape entirely, so there is no fidelity to keep, and
			// one text format serves both this page and the desktop file it also reads.
			return { status: "found", json: JSON.stringify(config) };
		} finally {
			database.close();
		}
	} catch (err) {
		return { status: "error", reason: err instanceof Error ? err.message : String(err) };
	}
}

/** Answer a verified request, addressed back to the origin that made it. */
async function answer(event: MessageEvent, request: TransferRequest): Promise<void> {
	const result = await readConfig();
	const source = event.source as WindowProxy | null;

	// Addressed to the requesting origin, never to `*`. This is the message that
	// carries the credentials.
	source?.postMessage(
		{ channel: CHANNEL, version: VERSION, type: "result", nonce: request.nonce, ...result },
		event.origin,
	);
}

function handleMessage(event: MessageEvent): void {
	const request = readRequest(event);

	if (!request || answered.has(request.nonce)) {
		return;
	}

	// Verified before anything is read. An embedder that never identifies itself
	// as ours causes no storage access at all, which is the point of asking it to
	// speak first rather than announcing the configuration unprompted.
	if (!isTrustedRequester(event.origin)) {
		return;
	}

	answered.add(request.nonce);

	void answer(event, request);
}

// Nothing happens on a page opened directly - there is no one to answer.
if (window.parent !== window) {
	window.addEventListener("message", handleMessage);

	// The embedder's origin cannot be discovered from in here, so readiness is
	// announced instead and the embedder identifies itself in reply. Broadcast
	// safely because it carries nothing: the configuration only ever travels in
	// the addressed answer above.
	window.parent.postMessage({ channel: CHANNEL, version: VERSION, type: "ready" }, "*");

	// An embedder that loads this page and then asks for nothing leaves a listener
	// behind for as long as the frame lives. Stop listening rather than waiting
	// indefinitely; the embedder reloads the frame if it wants another chance.
	setTimeout(() => window.removeEventListener("message", handleMessage), REQUEST_TIMEOUT);
}
