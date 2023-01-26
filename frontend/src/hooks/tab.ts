import { uid } from "radash";
import { actions, store, useStoreValue } from "~/store";

/**
 * Returns the active tab
 */
export function useActiveTab() {
	const activeTab = useStoreValue(state => state.activeTab);
	const knownTabs = useStoreValue(state => state.config.tabs);

	return knownTabs.find(tab => tab.id === activeTab);
}

const NEW_CONNECTION = {
	endpoint: 'http://localhost:8000/',
	username: 'root',
	password: 'root',
	namespace: '',
	database: ''
}

/**
 * Create a new tab with the given name and query
 * 
 * @param name The name of the tab
 * @param query The query to run when the tab is opened
 */
export function useTabCreator(): (name: string, query?: string) => string {
	const tabList = useStoreValue(state => state.config.tabs);
	const connection = useActiveTab()?.connection;
	
	return (name, query) => {
		const tabId = uid(5);

		function buildName(n: number) {
			return `${name} ${n ? n + 1 : ''}`.trim();
		}

		let tabName = '';
		let counter = 0;

		do {
			tabName = buildName(counter);
			counter++;
		} while(tabList.find(tab => tab.name === tabName));

		store.dispatch(actions.addTab({
			id: tabId,
			name: tabName,
			query: query || '',
			variables: '{}',
			lastResponse: [],
			layout: {},
			connection: {
				...NEW_CONNECTION,
				...connection
			}
		}));

		return tabId;
	}
}