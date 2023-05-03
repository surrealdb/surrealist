import { actions, store } from "~/store";
import { newId, updateConfig, updateTitle } from "./helpers";
import { SurrealConnection } from "~/surreal";

/**
 * Returns the currently active tab
 */
export function getActiveTab() {
	const { activeTab, tabs } = store.getState().config;

	return tabs.find(tab => tab.id === activeTab);
}

/**
 * Create a new default environment
 */
export function createDefaultEnvironment(): string {
	const envId = newId();

	store.dispatch(actions.setEnvironments([{
		id: envId,
		name: 'Default',
		connection: {}
	}]));

	return envId;
}

/**
 * Merge two connections together
 */
export function mergeConnections(left: Partial<SurrealConnection>, right: Partial<SurrealConnection>): SurrealConnection {
	const leftFields = left.scopeFields || [];
	const rightFields = right.scopeFields || [];

	return {
		namespace: left.namespace || right.namespace || '',
		database: left.database || right.database || '',
		endpoint: left.endpoint || right.endpoint || '',
		username: left.username || right.username || '',
		password: left.password || right.password || '',
		authMode: left.authMode || right.authMode || '' as any,
		scope: left.scope || right.scope || '',
		scopeFields: [...leftFields, ...rightFields]
	};
}

/**
 * Returns whether the given connection is valid
 */
export function isConnectionValid(details: SurrealConnection | undefined) {
	if (!details) {
		return false;
	}

	return details.endpoint && details.namespace && details.database && details.username && details.password && details.authMode;
}

export interface CreateOptions {
	name?: string;
	query?: string;
	environment?: string;
}

/**
 * Create a new tab in the current environment
 */
export function createNewTab(options?: CreateOptions) {
	const { environments, tabs } = store.getState().config;

	const envId = options?.environment	// 1. Expicit environment
		|| getActiveTab()?.environment	// 2. Current tab's environment
		|| environments[0]?.id			// 3. First environment
		|| createDefaultEnvironment();  // 4. Create default environment

	const tabId = newId();
	const envTabs = tabs.filter(tab => tab.environment === envId);
	const inherited = store.getState().config.environments.find(env => env.id === envId)?.connection;

	function buildName(n: number) {
		return `${options?.name || 'New tab'} ${n ? n + 1 : ''}`.trim();
	}

	let tabName = '';
	let counter = 0;

	do {
		tabName = buildName(counter);
		counter++;
	} while(envTabs.find(tab => tab.name === tabName));

	store.dispatch(actions.addTab({
		id: tabId,
		name: tabName,
		environment: envId,
		query: options?.query || '',
		variables: '{}',
		lastResponse: [],
		activeView: 'query',
		connection: {
			endpoint: inherited?.endpoint ? '' : 'http://localhost:8000/',
			namespace: inherited?.namespace ? '' : 'test',
			database: inherited?.database ? '' : 'test',
			username: inherited?.username ? '' : 'root',
			password: inherited?.password ? '' : 'root',
			authMode: inherited?.authMode ? '' : 'root' as any,
			scope: '',
			scopeFields: []
		}
	}));

	store.dispatch(actions.setActiveTab(tabId));

	updateTitle();
	updateConfig();
}