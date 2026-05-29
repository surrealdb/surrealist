/**
 * Push every saved query, query tab, and on-disk `.surql` file the
 * config store knows about into the language server's workspace
 * snapshot.
 *
 * This unlocks cross-file analysis: a `fn::foo` defined in tab A is
 * resolved when typed in tab B, "unknown table" diagnostics know
 * about schemas from any pane, and so on. The shared LSP worker
 * already merges open editor buffers on top of the workspace
 * snapshot, so opening a tab in the query view will override the
 * snapshot for that URI without us doing anything special.
 */

import { readQuery } from "~/screens/surrealist/pages/Connection/views/query/QueryView/strategy";
import { useConfigStore } from "~/stores/config";
import type { Connection, QueryTab } from "~/types";
import { watchStore } from "~/util/config";
import type { SurqlLspClient } from "./client";

const PUSH_DEBOUNCE_MS = 500;

/**
 * URI scheme matches the per-editor URI used by the CodeMirror
 * extension in `QueryPane` so the server's "open buffer overrides
 * workspace" merge does the right thing once the user opens a tab.
 */
function tabUri(tabId: string): string {
	return `surrealist:///query/${tabId}.surql`;
}

function savedQueryUri(savedId: string): string {
	return `surrealist:///saved/${savedId}.surql`;
}

interface ProjectedTab {
	uri: string;
	tab: QueryTab;
}

/**
 * Build the static (sync-readable) URI list. File-backed tabs need an
 * async read step; we kick those off after the initial sync flush.
 */
function projectTabs(connections: Connection[]): ProjectedTab[] {
	const projected: ProjectedTab[] = [];

	for (const connection of connections) {
		for (const tab of connection.queries) {
			projected.push({ uri: tabUri(tab.id), tab });
		}
	}

	return projected;
}

interface SyncSelector {
	connections: Connection[];
	sandbox: Connection;
	savedQueries: ReadonlyArray<{ id: string; query: string }>;
}

export function attachWorkspaceSync(client: SurqlLspClient): () => void {
	let scheduled: ReturnType<typeof setTimeout> | null = null;
	let lastSnapshot = new Map<string, string>();
	let disposed = false;
	// Single-flight guard. A flush mutates `lastSnapshot`, so two
	// concurrent runs can compute their diffs against stale state and
	// either drop live URIs or duplicate pushes. We keep one in flight
	// at a time and squash queued requests to the latest selection.
	let isFlushing = false;
	let pendingSelection: SyncSelector | null = null;
	// Forces the next flush to use `replaceWorkspace` regardless of
	// whether `lastSnapshot` is empty. Set after a manual restart so
	// the new worker starts from a clean baseline.
	let forceReplace = false;

	const flushNow = async (selection: SyncSelector) => {
		const projected = projectTabs([selection.sandbox, ...selection.connections]);
		const next = new Map<string, string>();

		// Pull saved query bodies first (they're always synchronous).
		for (const saved of selection.savedQueries) {
			next.set(savedQueryUri(saved.id), saved.query);
		}

		// Read each tab's contents. Config tabs resolve synchronously;
		// file-backed tabs hit the desktop adapter and may fail.
		// On failure we fall back to the previously cached body so a
		// transient read error doesn't yank the document out of the
		// LSP workspace and break cross-file analysis until restart.
		await Promise.all(
			projected.map(async ({ uri, tab }) => {
				try {
					const text = await Promise.resolve(readQuery(tab));
					next.set(uri, text ?? "");
				} catch {
					const previous = lastSnapshot.get(uri);
					if (previous !== undefined) {
						next.set(uri, previous);
					}
				}
			}),
		);

		if (disposed) return;

		// `replaceWorkspace` is used for the initial flush AND after a
		// manual restart so the new worker doesn't accumulate stale
		// state from before the crash.
		const isInitial = lastSnapshot.size === 0 || forceReplace;
		if (isInitial) {
			client.replaceWorkspace(Array.from(next, ([uri, text]) => ({ uri, text })));
			forceReplace = false;
		} else {
			for (const [uri, text] of next) {
				if (lastSnapshot.get(uri) !== text) {
					client.pushWorkspaceDocument(uri, text);
				}
			}
			for (const uri of lastSnapshot.keys()) {
				if (!next.has(uri)) {
					client.dropWorkspaceDocument(uri);
				}
			}
		}

		lastSnapshot = next;
	};

	const flush = async (selection: SyncSelector) => {
		if (disposed) return;
		if (isFlushing) {
			pendingSelection = selection;
			return;
		}
		isFlushing = true;
		try {
			await flushNow(selection);
		} finally {
			isFlushing = false;
			if (!disposed && pendingSelection) {
				const next = pendingSelection;
				pendingSelection = null;
				void flush(next);
			}
		}
	};

	const schedule = (selection: SyncSelector) => {
		if (scheduled !== null) {
			clearTimeout(scheduled);
		}
		scheduled = setTimeout(() => {
			scheduled = null;
			void flush(selection);
		}, PUSH_DEBOUNCE_MS);
	};

	// `watchStore` selects a stable shape so deep-equality skips runs
	// when nothing pertinent changed (cursor moves, query results, etc).
	const select = (state: ReturnType<typeof useConfigStore.getState>): SyncSelector => ({
		connections: state.connections,
		sandbox: state.sandbox,
		savedQueries: state.savedQueries.map((q) => ({ id: q.id, query: q.query })),
	});

	// Run the initial flush immediately (no debounce) so the server has
	// a usable workspace by the time the first editor mounts.
	void flush(select(useConfigStore.getState()));

	// Subsequent flushes are debounced. The active editor pushes its
	// buffer through `documentSyncPlugin` (`didChange`); this pump is
	// only responsible for the saved/inactive tabs and `savedQueries`.
	const offConfig = watchStore({
		store: useConfigStore,
		select,
		then: (selection) => schedule(selection),
	});

	// After a manual restart the new worker has no workspace; re-push
	// from the current store state. We treat it as a fresh "initial"
	// flush so the worker receives a single `replaceWorkspace`.
	const offRestart = client.onRestart(() => {
		lastSnapshot = new Map();
		forceReplace = true;
		void flush(select(useConfigStore.getState()));
	});

	return () => {
		disposed = true;
		offConfig();
		offRestart();
		if (scheduled !== null) {
			clearTimeout(scheduled);
			scheduled = null;
		}
	};
}
