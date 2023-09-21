import { SurrealistConfig } from "~/types";

export function createBaseConfig(): SurrealistConfig {
	return {
		theme: "automatic",
		tabs: [],
		environments: [],
		isPinned: false,
		activeTab: null,
		autoConnect: true,
		tableSuggest: true,
		wordWrap: true,
		queryHistory: [],
		queryFavorites: [],
		localDriver: "memory",
		localStorage: "",
		surrealPath: "",
		surrealUser: "root",
		surrealPass: "root",
		surrealPort: 8000,
		enableConsole: false,
		enableListing: false,
		queryTimeout: 10,
		updateChecker: true,
		queryListing: "history",
		resultListing: "json",
		fontZoomLevel: 1,
		errorChecking: true,
		lastPromptedVersion: null,
		tabSearch: false,
		defaultDesignerNodeMode: 'fields',
		defaultDesignerLayoutMode: 'diagram',
	};
}
