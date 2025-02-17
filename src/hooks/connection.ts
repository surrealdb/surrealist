import { compareVersions } from "compare-versions";
import { unique } from "radash";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { SANDBOX, VIEW_PAGES } from "~/constants";
import { useConfigStore } from "~/stores/config";
import { useDatabaseStore } from "~/stores/database";
import { Connection, ViewCondition, ViewPage, ViewPageInfo } from "~/types";
import { useConnectionAndView } from "./routing";
import { useFeatureFlags } from "~/util/feature-flags";

/**
 * Returns whether Surrealist is connected to a database
 */
export function useIsConnected() {
	return useDatabaseStore((s) => s.currentState === "connected");
}

/**
 * Returns whether Surrealist is connecting to a database
 */
export function useIsConnecting() {
	return useDatabaseStore(
		(s) => s.currentState === "connecting" || s.currentState === "retrying",
	);
}

/**
 * Return a list of all connections
 */
export function useConnectionList() {
	return useConfigStore((s) => s.connections);
}

/**
 * Select fields from the active connection
 *
 * @param selector A function to select fields from the connection
 */
export function useConnection<T>(selector: (con?: Connection) => T): T {
	const [connection] = useConnectionAndView();

	return useConfigStore(
		useShallow((s) => {
			if (connection === SANDBOX) {
				return selector(s.sandbox);
			}

			return selector(s.connections.find((c) => c.id === connection));
		}),
	);
}

/**
 * Returns information about the active connection view
 */
export function useView() {
	const [, view] = useConnectionAndView();

	return view ? VIEW_PAGES[view] : null;
}

/**
 * Returns a mapping of available views based on the current connection
 */
export function useAvailableViews(): Partial<Record<ViewPage, ViewPageInfo>> {
	const [flags] = useFeatureFlags();

	const [connection, isCloud] = useConnection((c) => [
		c?.id ?? "",
		c?.authentication.mode === "cloud",
	]);

	return useMemo(() => {
		const draft = { ...VIEW_PAGES } as const;
		const condition: ViewCondition = {
			connection,
			flags,
			isCloud,
		};

		for (const { id, disabled } of Object.values(draft)) {
			if (disabled?.(condition)) {
				delete draft[id];
			}
		}

		return draft;
	}, [flags, connection, isCloud]);
}

/**
 * Returns a list of all saved query tags
 */
export function useSavedQueryTags() {
	const queries = useConfigStore((s) => s.savedQueries);

	return useMemo(() => {
		return unique(queries.flatMap((q) => q.tags));
	}, [queries]);
}

/**
 * Returns whether the current database version is at least the minimum version
 */
export function useMinimumVersion(minimum: string) {
	const version = useDatabaseStore((s) => s.version);
	const isGreater = !version || compareVersions(version, minimum) >= 0;

	return [isGreater, version] as const;
}

/**
 * Return the selected query tab from the active connection
 *
 * @returns The selected query tab
 */
export function useActiveQuery() {
	return useConnection((c) => {
		return c?.queries.find((q) => q.id === c.activeQuery);
	});
}
