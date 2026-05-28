/**
 * Public surface of the SurrealQL language-server integration.
 *
 * Most consumers only need [`surqlLanguageServer`] (the CodeMirror
 * extension) plus the lazily-initialised [`getSharedSurqlLspClient`]
 * helper which constructs a single Web Worker for the whole app.
 */

import { useConfigStore } from "~/stores/config";
import { watchStore } from "~/util/config";
import { SurqlLspClient } from "./client";
import { attachLiveMetadataPump } from "./metadata";
import { buildInitializationOptions } from "./settings";
import { attachWorkspaceSync } from "./workspace";

export { SurqlLspClient } from "./client";
export type { SurqlLanguageServerOptions } from "./extension";
export { surqlLanguageServer } from "./extension";
export { attachLiveMetadataPump, onLiveMetadataCount } from "./metadata";

let sharedClient: SurqlLspClient | null = null;
const detachers: Array<() => void> = [];

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
	void client.startInitialization(buildInitializationOptions()).catch((error) => {
		console.warn("surrealql language server: initialize failed", error);
	});

	detachers.push(attachLiveMetadataPump(client));
	detachers.push(attachConfigurationPump(client));
	detachers.push(attachWorkspaceSync(client));
	sharedClient = client;
	return client;
}

/**
 * Forward `workspace/didChangeConfiguration` notifications whenever
 * the active connection (or its credentials) change. Without this the
 * server keeps using the snapshot it pulled during `initialize` and
 * silently talks to a stale endpoint after a NS/DB switch.
 */
function attachConfigurationPump(client: SurqlLspClient): () => void {
	return watchStore({
		store: useConfigStore,
		select: () => buildInitializationOptions(),
		then: (settings) => {
			void client
				.sendNotification("workspace/didChangeConfiguration", {
					settings: { surrealql: settings },
				})
				.catch((error) => {
					console.warn("surrealql language server: didChangeConfiguration failed", error);
				});
		},
	});
}

/**
 * Tear down the shared client. Mostly useful for tests / hot module
 * reload — production callers leave the worker running for the
 * lifetime of the page.
 */
export function disposeSharedSurqlLspClient(): void {
	while (detachers.length > 0) {
		detachers.pop()?.();
	}
	sharedClient?.dispose();
	sharedClient = null;
}
