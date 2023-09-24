import { useStoreValue } from "~/store";
import { mergeConnections } from "~/util/environments";

/**
 * Returns the active tab, or undefined
 */
export function useSession() {
	const activeSession = useStoreValue((state) => state.config.activeTab);
	const knownTabs = useStoreValue((state) => state.config.tabs);

	return knownTabs.find((tab) => tab.id === activeSession);
}

/**
 * Returns the active tab
 */
export function useActiveSession() {
	const session = useSession();

	if (!session) {
		throw new Error("Session unavailable");
	}

	return session;
}

/**
 * Returns the active environment, or undefined
 */
export function useEnvironment() {
	const environments = useStoreValue((state) => state.config.environments);
	const activeSession = useActiveSession();

	return environments.find((e) => e.id === activeSession?.environment);
}

/**
 * Returns the active environment
 */
export function useActiveEnvironment() {
	const environment = useEnvironment();

	if (!environment) {
		throw new Error("Environment unavailable");
	}

	return environment;
}

/**
 * Returns the active query tab
 * 
 * @returns The active query tab
 */
export function useActiveQuery() {
	const activeSession = useActiveSession();
	
	return activeSession.queries.find((q) => q.id === activeSession.activeQueryId)!;
}

/**
 * Return a list of all tabs
 */
export function useTabsList() {
	return useStoreValue((state) => state.config.tabs);
}

/**
 * Return a list of all environments
 */
export function useEnvironmentList() {
	return useStoreValue((state) => state.config.environments);
}

/**
 * Returns the fully merged connection details for the active tab
 */
export function useConnectionDetails() {
	const sessionInfo = useActiveSession();

	if (!sessionInfo) {
		return null;
	}

	const environments = useEnvironmentList();
	const envInfo = environments.find((env) => env.id === sessionInfo.environment);

	return mergeConnections(sessionInfo.connection, envInfo?.connection || {});
}
