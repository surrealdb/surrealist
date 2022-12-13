import { useStoreValue } from "~/store";

/**
 * Returns the active tab
 */
export function useActiveTab() {
	const activeTab = useStoreValue(state => state.activeTab);
	const knownTabs = useStoreValue(state => state.knownTabs);

	return knownTabs.find(tab => tab.id === activeTab);
}