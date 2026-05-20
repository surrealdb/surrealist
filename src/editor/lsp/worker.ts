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

const ready = (async () => {
	await init(wasmPath);

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
})();

self.addEventListener("message", async (event: MessageEvent<WorkerInbound>) => {
	const message = event.data;
	const server = await ready;

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
});
