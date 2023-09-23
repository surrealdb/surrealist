import { useStoreValue } from "~/store";
import { mergeConnections } from "~/util/environments";

/**
 * Returns the active tab
 */
export function useActiveTab() {
	const activeTab = useStoreValue((state) => state.config.activeTab);
	const knownTabs = useStoreValue((state) => state.config.tabs);

	return knownTabs.find((tab) => tab.id === activeTab);
}

/**
 * Returns the active environment
 */
export function useActiveEnvironment() {
	const environments = useStoreValue((state) => state.config.environments);
	const activeTab = useActiveTab();

	return environments.find((e) => e.id === activeTab?.environment);
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
	const tabInfo = useActiveTab();

	if (!tabInfo) {
		return null;
	}

	const environments = useEnvironmentList();
	const envInfo = environments.find((env) => env.id === tabInfo.environment);

	return mergeConnections(tabInfo.connection, envInfo?.connection || {});
}
