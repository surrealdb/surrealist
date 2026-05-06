/**
 * Public surface of the SurrealQL language-server integration.
 *
 * Most consumers only need [`surqlLanguageServer`] (the CodeMirror
 * extension) plus the lazily-initialised [`getSharedSurqlLspClient`]
 * helper which constructs a single Web Worker for the whole app.
 */

import { SurqlLspClient } from "./client";
import { attachLiveMetadataPump } from "./metadata";
import { buildInitializationOptions } from "./settings";

export { SurqlLspClient } from "./client";
export type { SurqlLanguageServerOptions } from "./extension";
export { surqlLanguageServer } from "./extension";
export { attachLiveMetadataPump } from "./metadata";

let sharedClient: SurqlLspClient | null = null;
let detachMetadataPump: (() => void) | null = null;

/**
 * Lazily build (and remember) a process-wide language-server client.
 * Editors share a single worker so the workspace state and live
 * metadata cache stay consistent across panes.
 */
export function getSharedSurqlLspClient(): SurqlLspClient {
	if (sharedClient) {
		return sharedClient;
	}
	const client = new SurqlLspClient({
		provideConfiguration: () => ({ surrealql: buildInitializationOptions() }),
	});
	void client
		.sendRequest("initialize", {
			processId: null,
			capabilities: {},
			initializationOptions: { surrealql: buildInitializationOptions() },
		})
		.then(() => client.sendNotification("initialized", {}))
		.catch((error) => {
			console.warn("surrealql language server: initialize failed", error);
		});

	detachMetadataPump = attachLiveMetadataPump(client);
	sharedClient = client;
	return client;
}

/**
 * Tear down the shared client. Mostly useful for tests / hot module
 * reload — production callers leave the worker running for the
 * lifetime of the page.
 */
export function disposeSharedSurqlLspClient(): void {
	detachMetadataPump?.();
	detachMetadataPump = null;
	sharedClient?.dispose();
	sharedClient = null;
}
