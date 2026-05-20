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

	const flush = async (selection: SyncSelector) => {
		if (disposed) return;

		const projected = projectTabs([selection.sandbox, ...selection.connections]);
		const next = new Map<string, string>();

		// Pull saved query bodies first (they're always synchronous).
		for (const saved of selection.savedQueries) {
			next.set(savedQueryUri(saved.id), saved.query);
		}

		// Read each tab's contents. Config tabs resolve synchronously;
		// file-backed tabs hit the desktop adapter and may fail.
		await Promise.all(
			projected.map(async ({ uri, tab }) => {
				try {
					const text = await Promise.resolve(readQuery(tab));
					next.set(uri, text ?? "");
				} catch {
					// Surfaced inside the strategy itself.
				}
			}),
		);

		if (disposed) return;

		// Diff against the previous snapshot to minimise worker traffic.
		// Initial flush always uses replaceWorkspace to guarantee the
		// server starts from a clean slate.
		const isInitial = lastSnapshot.size === 0;
		if (isInitial) {
			client.replaceWorkspace(Array.from(next, ([uri, text]) => ({ uri, text })));
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

	return () => {
		disposed = true;
		offConfig();
		if (scheduled !== null) {
			clearTimeout(scheduled);
			scheduled = null;
		}
	};
}
