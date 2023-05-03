import { SurrealistConfig } from "~/typings";

export function createBaseConfig(): SurrealistConfig {
	return {
		theme: 'automatic',
		tabs: [],
		environments: [],
		activeTab: null,
		autoConnect: true,
		tableSuggest: true,
		wordWrap: true,
		queryHistory: [],
		queryFavorites: [],
		localDriver: 'memory',
		localStorage: '',
		surrealPath: '',
		enableConsole: true,
		enableListing: false,
		queryTimeout: 10,
		updateChecker: true,
		queryListing: 'history',
		resultListing: 'json',
		zoomLevel: 1
	};
}