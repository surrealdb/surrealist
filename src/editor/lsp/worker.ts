/// <reference lib="webworker" />

/**
 * Web Worker that hosts the SurrealQL language-server WASM module.
 *
 * Surrealist communicates with this worker over a small typed
 * postMessage protocol (see [`protocol.ts`](./protocol.ts)):
 *
 *  * Inbound `rpc` messages carry a JSON-RPC string that the wasm
 *    module decodes into an LSP request/notification.
 *  * Inbound mutators (`pushWorkspaceDocument`, `setLiveMetadata`,
 *    etc.) flow straight into the matching `WasmLanguageServer`
 *    method.
 *  * Outbound notifications come in two forms:
 *      * `publishDiagnostics` / `logMessage` — pushed by the wasm
 *        side via the JS callbacks installed below.
 *      * `requestConfiguration` — server-initiated request; the host
 *        replies with a matching `configuration` message keyed by id.
 */

import init, { WasmLanguageServer } from "@surrealdb/surrealql-language-server";
import wasmPath from "@surrealdb/surrealql-language-server/surrealql_language_server_bg.wasm?url";
import type { WorkerInbound, WorkerOutbound } from "./protocol";

declare const self: DedicatedWorkerGlobalScope;

const post = (message: WorkerOutbound) => self.postMessage(message);

const pendingConfigurations = new Map<number, (value: unknown) => void>();
let nextConfigurationId = 1;

let initPromise: ReturnType<typeof init> | undefined;

/**
 * Load the wasm module via `fetch` + `arrayBuffer`, matching the
 * `@surrealdb/wasm` strategy. Browsers transparently gunzip responses
 * that carry `Content-Encoding: gzip`, which is required when the build
 * ships pre-compressed `.wasm` assets.
 */
async function initializeLanguageServer(): Promise<void> {
	if (initPromise === undefined) {
		const wasmCode = await fetch(wasmPath).then((response) => response.arrayBuffer());
		initPromise = init({ module_or_path: wasmCode });
	}
	await initPromise;
}

// Defensive ceiling: if the host never replies (terminated, hung,
// race during teardown), resolve with `null` instead of wedging the
// language-server task that issued `workspace/configuration`.
const CONFIGURATION_TIMEOUT_MS = 2000;

const requestConfigurationFromHost = (): Promise<unknown> => {
	const id = nextConfigurationId++;
	return new Promise((resolve) => {
		const finish = (value: unknown) => {
			if (!pendingConfigurations.has(id)) return;
			pendingConfigurations.delete(id);
			resolve(value);
		};

		pendingConfigurations.set(id, finish);
		post({ kind: "requestConfiguration", id });
		setTimeout(() => finish(null), CONFIGURATION_TIMEOUT_MS);
	});
};

/** Cached fatal init error; surfaced again to every queued task. */
let initFailure: Error | null = null;

const ready = (async () => {
	try {
		await initializeLanguageServer();

		const server = new WasmLanguageServer({
			onPublishDiagnostics: (uri: string, diagnostics: unknown) => {
				post({ kind: "publishDiagnostics", uri, diagnostics });
			},
			onLogMessage: (level: number, message: string) => {
				post({ kind: "logMessage", level, message });
			},
			onRequestConfiguration: requestConfigurationFromHost,
		});

		post({ kind: "ready" });
		return server;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		initFailure = error instanceof Error ? error : new Error(message);
		post({ kind: "initError", message });
		throw error;
	}
})();

/**
 * Process inbound messages one at a time. Tab switches and workspace
 * sync can fire overlapping `didOpen`/`didClose`/workspace updates;
 * the WASM server mutates shared state and must not handle them
 * concurrently.
 *
 * Errors thrown inside a queued task are caught at the chain root and
 * forwarded to the host as a level-1 `logMessage`, so the client can
 * surface the failure (instead of silently dropping every subsequent
 * message after a wasm panic).
 */
let processing: Promise<void> = Promise.resolve();

function enqueue(task: () => Promise<void>): void {
	processing = processing
		.catch(() => {
			/* root chain swallowed below; tasks must be independent */
		})
		.then(() => task())
		.catch((error: unknown) => {
			const message = error instanceof Error ? error.message : String(error);
			post({
				kind: "logMessage",
				level: 1,
				message: `worker task failed: ${message}`,
			});
		});
}

async function handleMessage(server: WasmLanguageServer, message: WorkerInbound): Promise<void> {
	switch (message.kind) {
		case "rpc": {
			try {
				const response = await server.handleMessage(message.payload);
				post({
					kind: "rpcResult",
					id: message.id,
					payload: typeof response === "string" ? response : null,
				});
			} catch (error) {
				post({
					kind: "rpcError",
					id: message.id,
					message: error instanceof Error ? error.message : String(error),
				});
			}
			return;
		}
		case "pushWorkspaceDocument": {
			await server.pushWorkspaceDocument(message.uri, message.text);
			return;
		}
		case "dropWorkspaceDocument": {
			await server.dropWorkspaceDocument(message.uri);
			return;
		}
		case "replaceWorkspace": {
			await server.replaceWorkspace(message.documents);
			return;
		}
		case "setLiveMetadata": {
			await server.setLiveMetadata(message.defineStrings);
			return;
		}
		case "configuration": {
			const resolver = pendingConfigurations.get(message.id);
			// The resolver removes itself from the map; just hand off.
			if (typeof resolver === "function") {
				resolver(message.value);
			}
			return;
		}
	}
}

self.addEventListener("message", (event: MessageEvent<WorkerInbound>) => {
	const message = event.data;
	enqueue(async () => {
		if (initFailure) {
			// Drop the message but produce a clear signal so RPCs reject
			// instead of hanging. Mutators (`pushWorkspaceDocument` etc.)
			// have no caller to notify, so we just log and move on.
			if (message.kind === "rpc") {
				post({
					kind: "rpcError",
					id: message.id,
					message: `language server failed to initialise: ${initFailure.message}`,
				});
			}
			return;
		}

		let server: WasmLanguageServer;
		try {
			server = await ready;
		} catch (error) {
			const text = error instanceof Error ? error.message : String(error);
			if (message.kind === "rpc") {
				post({
					kind: "rpcError",
					id: message.id,
					message: `language server failed to initialise: ${text}`,
				});
			}
			return;
		}

		await handleMessage(server, message);
	});
});
