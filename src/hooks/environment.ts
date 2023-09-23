import { useStoreValue } from "~/store";
import { mergeConnections } from "~/util/environments";

/**
 * Returns the active tab
 */
export function useActiveSession() {
	const activeSession = useStoreValue((state) => state.config.activeTab);
	const knownTabs = useStoreValue((state) => state.config.tabs);

	return knownTabs.find((tab) => tab.id === activeSession);
}

/**
 * Returns the active environment
 */
export function useActiveEnvironment() {
	const environments = useStoreValue((state) => state.config.environments);
	const activeSession = useActiveSession();

	return environments.find((e) => e.id === activeSession?.environment);
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
