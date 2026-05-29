/**
 * Public surface of the SurrealQL language-server integration.
 *
 * Most consumers only need [`surqlLanguageServer`] (the CodeMirror
 * extension) plus the lazily-initialised [`getSharedSurqlLspClient`]
 * helper which constructs a single Web Worker for the whole app.
 */

import { debounce } from "radash";
import { useConfigStore } from "~/stores/config";
import { watchStore } from "~/util/config";
import { SurqlLspClient } from "./client";
import { attachLiveMetadataPump } from "./metadata";
import { buildInitializationOptions } from "./settings";
import { attachWorkspaceSync } from "./workspace";

export type {
	SurqlLspError,
	SurqlLspMethodMetric,
	SurqlLspMetrics,
	SurqlLspState,
	SurqlLspTelemetry,
} from "./client";
export { SurqlLspClient } from "./client";
export type { SurqlLanguageServerOptions } from "./extension";
export { surqlLanguageServer } from "./extension";
export { attachLiveMetadataPump, onLiveMetadataCount } from "./metadata";

/** Trailing debounce window for `workspace/didChangeConfiguration`. */
const CONFIGURATION_PUMP_DEBOUNCE_MS = 250;

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
	if (import.meta.env.DEV) {
		detachers.push(attachDevConsoleLogForwarding(client));
	}
	sharedClient = client;
	return client;
}

/**
 * Trigger a manual restart of the shared client. Used by the
 * `LspStatus` indicator after the worker has crashed or
 * `initialize` has failed.
 */
export function restartSharedSurqlLspClient(): Promise<void> {
	if (!sharedClient) return Promise.resolve();
	return sharedClient.restart(buildInitializationOptions());
}

/**
 * Forward `workspace/didChangeConfiguration` notifications whenever
 * the active connection (or its credentials) change. Without this the
 * server keeps using the snapshot it pulled during `initialize` and
 * silently talks to a stale endpoint after a NS/DB switch.
 *
 * Trailing-debounced so token rotations or rapid auth edits don't
 * thrash the server (every notification triggers a workspace walk
 * and live-metadata refetch on the wasm side).
 */
function attachConfigurationPump(client: SurqlLspClient): () => void {
	const push = debounce({ delay: CONFIGURATION_PUMP_DEBOUNCE_MS }, (settings: unknown) => {
		void client
			.sendNotification("workspace/didChangeConfiguration", {
				settings: { surrealql: settings },
			})
			.catch((error) => {
				if (import.meta.env.DEV) {
					console.warn("surrealql language server: didChangeConfiguration failed", error);
				}
			});
	});

	const off = watchStore({
		store: useConfigStore,
		select: () => buildInitializationOptions(),
		then: (settings) => push(settings),
	});

	const offRestart = client.onRestart(() => {
		// `restart()` re-runs `initialize` with the latest settings;
		// no immediate re-push is needed here. We only ensure no stale
		// debounced notification fires against the new worker with old
		// settings.
		push.cancel();
	});

	return () => {
		off();
		offRestart();
		push.cancel();
	};
}

/**
 * Mirror server-side `window/logMessage` to `console.debug` so the
 * dev console gets a live trace of LSP activity. Production builds
 * keep these messages confined to the (visible) status popover so we
 * never spam users with internal telemetry.
 */
function attachDevConsoleLogForwarding(client: SurqlLspClient): () => void {
	return client.onLog((level, message) => {
		const prefix = "[surrealql lsp]";
		if (level === 1) {
			console.error(prefix, message);
		} else if (level === 2) {
			console.warn(prefix, message);
		} else {
			console.debug(prefix, message);
		}
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

// Vite HMR otherwise leaks the worker on every hot reload because the
// module's top-level state is reset but the spawned `Worker` lives on.
// In production the entire app reloads on update, so this is dev-only.
if (import.meta.hot) {
	import.meta.hot.dispose(() => {
		disposeSharedSurqlLspClient();
	});
}
