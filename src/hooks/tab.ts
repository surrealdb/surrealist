import { useStoreValue } from "~/store";

/**
 * Returns the active tab
 */
export function useActiveTab() {
	const activeTab = useStoreValue(state => state.config.activeTab);
	const knownTabs = useStoreValue(state => state.config.tabs);

	return knownTabs.find(tab => tab.id === activeTab);
}