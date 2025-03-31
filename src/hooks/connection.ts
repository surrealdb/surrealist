import { compareVersions } from "compare-versions";
import { pick, unique } from "radash";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useCloudInstanceList } from "~/cloud/hooks/instances";
import { SANDBOX, VIEW_PAGES } from "~/constants";
import { openRequiredDatabaseModal } from "~/modals/require-database";
import { useConfigStore } from "~/stores/config";
import { useDatabaseStore } from "~/stores/database";
import { CloudInstance, Connection, ViewCondition, ViewPage, ViewPageInfo } from "~/types";
import { createBaseConnection } from "~/util/defaults";
import { useFeatureFlags } from "~/util/feature-flags";
import { fuzzyMatch } from "~/util/helpers";
import { useConnectionAndView, useConnectionNavigator } from "./routing";
import { useStable } from "./stable";

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
 * Select fields from all connections
 *
 * @param selector A function to select fields from a connection
 */
export function useConnections<T>(selector: (con: Connection) => T): T[] {
	return useConfigStore(
		useShallow((s) => {
			return s.connections.map(selector);
		}),
	);
}

/**
 * Returns a list of all used connection labels
 */
export function useConnectionLabels() {
	const labels = useConfigStore((s) => s.connections.flatMap((c) => c.labels ?? []));

	return unique(labels);
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

/**
 * Requires a selected database before executing a callback
 */
export function useRequireDatabase(callback: () => void) {
	const hasDatabase = useConnection((c) => !!c?.lastDatabase);

	return useStable(() => {
		if (hasDatabase) {
			callback();
		} else {
			openRequiredDatabaseModal(callback);
		}
	});
}

export interface ConnectionFilter {
	search?: string;
	labels?: string[];
	labelMode?: "any" | "all";
	labelInclude?: boolean;
	includeEmpty?: boolean;
}

/**
 * Retrieve the structured list of instances and connections
 */
export function useConnectionOverview({
	search,
	labels = [],
	labelMode = "any",
	labelInclude = true,
	includeEmpty,
}: ConnectionFilter) {
	const { entries, isPending } = useCloudInstanceList();

	const connections = useConnectionList();
	const sandboxInfo = useConfigStore((s) => s.sandbox);

	const [userConnections, sandbox, organizations, isEmpty] = useMemo(() => {
		const organizations = [];
		const normalConnections = connections.filter((c) => !c.authentication.cloudInstance);
		const userConnections = filterConnections(
			normalConnections,
			search,
			labels,
			labelMode,
			labelInclude,
		);

		const [sandbox] = filterConnections([sandboxInfo], search, labels, labelMode, labelInclude);

		for (const entry of entries) {
			const instances = filterInstances(
				entry.instances,
				search,
				labels,
				labelMode,
				labelInclude,
			);

			if (instances.length > 0 || includeEmpty) {
				organizations.push({
					info: entry.organization,
					instances,
				});
			}
		}

		const isEmpty = !sandbox && userConnections.length === 0 && organizations.length === 0;

		return [userConnections, sandbox, organizations, isEmpty] as const;
	}, [connections, sandboxInfo, entries, search, labels, labelMode, labelInclude, includeEmpty]);

	return {
		isPending,
		isEmpty,
		sandbox,
		userConnections,
		organizations,
	};
}

/**
 * Filters connections based on search term and selected labels with filtering modes
 */
function filterConnections(
	list: Connection[],
	search?: string,
	labels?: string[],
	labelMode: "any" | "all" = "any",
	labelInclude = true,
) {
	if (!search && (!labels || labels.length === 0)) {
		return list;
	}

	return list.filter((target) => {
		if (labels && labels.length > 0 && target.labels?.length) {
			let matches = false;

			if (labelMode === "any") {
				// "OR" mode - connection has at least one of the selected labels
				matches = labels.some((label) => target.labels?.includes(label));
			} else {
				// "AND" mode - connection has all of the selected labels
				matches = labels.every((label) => target.labels?.includes(label));
			}

			// If include=false, EXCLUDE matching connections
			if (matches !== labelInclude) {
				return false;
			}
		}

		// Search filtering
		if (search) {
			const needle = search.toLowerCase();
			const name = target.name.toLowerCase();
			const hostname = target.authentication.hostname.toLowerCase();

			if (!fuzzyMatch(needle, name) && !fuzzyMatch(needle, hostname)) {
				return false;
			}
		}

		return true;
	});
}

/**
 * Filters cloud instances based on search term and selected labels with filtering modes
 */
function filterInstances(
	list: CloudInstance[],
	search?: string,
	labels?: string[],
	labelMode: "any" | "all" = "any",
	labelInclude = true,
) {
	if (!search && (!labels || labels.length === 0)) {
		return list;
	}

	const { connections } = useConfigStore.getState();

	return list.filter((target) => {
		const connection = connections.find((c) => c.authentication.cloudInstance === target.id);

		if (labels && labels.length > 0 && connection?.labels?.length) {
			let matches = false;

			if (labelMode === "any") {
				// "OR" mode - connection has at least one of the selected labels
				matches = labels.some((label) => connection.labels?.includes(label));
			} else {
				// "AND" mode - connection has all of the selected labels
				matches = labels.every((label) => connection.labels?.includes(label));
			}

			// If include=false, EXCLUDE matching connections
			if (matches !== labelInclude) {
				return false;
			}
		}

		// Search filtering
		if (search) {
			const needle = search.toLowerCase();
			const name = target.name.toLowerCase();
			const hostname = target.host.toLowerCase();

			if (!fuzzyMatch(needle, name) && !fuzzyMatch(needle, hostname)) {
				return false;
			}
		}

		return true;
	});
}
