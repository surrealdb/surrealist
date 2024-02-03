import { DesignerLayoutMode, DesignerNodeMode, DriverType, FavoritesEntry, HistoryEntry, QueryListing, ResultListing, SessionQuery, SurrealistEnvironment, SurrealistSession, TablePinAction, ViewMode } from "~/types";
import { createBaseConfig } from "~/util/defaults";
import { ThemeOption } from "~/util/theme";
import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { adapter } from "../adapter/index";
import { timeoutPromise } from "~/util/promise-timeout";

const adapterStorage: StateStorage = {
	async setItem(name, value) {
		if (name == 'surrealist-config') {
			return timeoutPromise(() => adapter.saveConfig(value));
		}
	},
	async getItem(name) {
		if (name == 'surrealist-config') {
			return timeoutPromise(() => adapter.loadConfig());
		}

		return null;
	},
	async removeItem(name) {
		if (name == 'surrealist-config') {
			return timeoutPromise(() => adapter.saveConfig("{}"));
		}
	},
};

function updateCurrentSession(state: ConfigStore, modifier: (tab: SurrealistSession) => Partial<SurrealistSession>) {
	let found = false;
	const tabs = state.tabs.map((tab) => {
		if (tab.id !== state.activeTab) return tab;
		found = true;
		return { ...tab, ...modifier(tab) };
	});

	if (!found) throw new Error("Session unavailable");
	return { tabs };
}

export type ConfigStore = {
	theme: ThemeOption,
	tabs: SurrealistSession[],
	environments: SurrealistEnvironment[],
	activeView: ViewMode,
	isPinned: boolean,
	activeTab: string | null,
	autoConnect: boolean,
	tableSuggest: boolean,
	wordWrap: boolean,
	queryHistory: HistoryEntry[],
	queryFavorites: FavoritesEntry[],
	localDriver: string,
	localStorage: string,
	surrealPath: string,
	surrealUser: string,
	surrealPass: string,
	surrealPort: number,
	enableConsole: boolean,
	enableListing: boolean,
	queryTimeout: number,
	updateChecker: boolean,
	queryListing: string,
	resultListing: string,
	fontZoomLevel: number,
	errorChecking: boolean,
	lastPromptedVersion: string | null,
	tabSearch: boolean,
	defaultDesignerLayoutMode: DesignerLayoutMode,
	defaultDesignerNodeMode: DesignerNodeMode,

	setColorScheme: (theme: ThemeOption) => void;
	setAutoConnect: (autoConnect: boolean) => void;
	setTableSuggest: (tableSuggest: boolean) => void;
	setErrorChecking: (errorChecking: boolean) => void;
	setWordWrap: (wordWrap: boolean) => void;
	setSessionSearch: (tabSearch: boolean) => void;
	setEnvironments: (environments: SurrealistEnvironment[]) => void;
	addSession: (tab: SurrealistSession) => void;
	removeSession: (tabId: string) => void;
	updateSession: (payload: Pick<SurrealistSession, 'id'> & Partial<SurrealistSession>) => void;
	updateCurrentSession: (modifier: (tab: SurrealistSession) => Partial<SurrealistSession>) => void;
	setSessions: (tabs: SurrealistSession[]) => void;
	setActiveSession: (activeTab: string) => void;
	setActiveView: (activeView: ViewMode) => void;
	addQueryTab: (query?: string) => void;
	removeQueryTab: (queryId: number) => void;
	updateQueryTab: (payload: Partial<SessionQuery>) => void;
	setActiveQueryTab: (activeQueryId: number) => void;
	setWindowPinned: (isPinned: boolean) => void;
	toggleWindowPinned: () => void;
	addHistoryEntry: (entry: HistoryEntry) => void;
	clearHistory: () => void;
	removeHistoryEntry: (entryId: string) => void;
	saveFavoritesEntry: (favorite: FavoritesEntry) => void;
	removeFavoritesEntry: (favoriteId: string) => void;
	setFavorites: (queryFavorites: FavoritesEntry[]) => void;
	setConsoleEnabled: (enableConsole: boolean) => void;
	setSurrealUser: (surrealUser: string) => void;
	setSurrealPass: (surrealPass: string) => void;
	setSurrealPort: (surrealPort: number) => void;
	setLocalDatabaseDriver: (localDriver: DriverType) => void;
	setLocalDatabaseStorage: (localStorage: string) => void;
	setSurrealPath: (surrealPath: string) => void;
	setQueryTimeout: (queryTimeout: number) => void;
	setUpdateChecker: (updateChecker: boolean) => void;
	setLastPromptedVersion: (lastPromptedVersion: string) => void;
	setShowQueryListing: (enableListing: boolean) => void;
	setQueryListingMode: (queryListing: QueryListing) => void;
	setResultListingMode: (resultListing: ResultListing) => void;
	increaseFontZoomLevel: () => void;
	decreaseFontZoomLevel: () => void;
	resetFontZoomLevel: () => void;
	setDesignerLayoutMode: (defaultDesignerLayoutMode: DesignerLayoutMode) => void;
	setDesignerNodeMode: (defaultDesignerNodeMode: DesignerNodeMode) => void;
	toggleTablePin: (pin: TablePinAction) => void;
	softReset: () => void;
}

export const useConfigStore = create<ConfigStore>()(persist(
	(set) => ({
		...createBaseConfig(),

		setColorScheme: (theme) => set(() => ({ theme })),
		setAutoConnect: (autoConnect) => set(() => ({ autoConnect })),
		setTableSuggest: (tableSuggest) => set(() => ({ tableSuggest })),
		setErrorChecking: (errorChecking) => set(() => ({ errorChecking })),
		setWordWrap: (wordWrap) => set(() => ({ wordWrap })),
		setSessionSearch: (tabSearch) => set(() => ({ tabSearch })),
		setEnvironments: (environments) => set(() => ({ environments })),
		addSession: (tab) => set((state) => ({
			tabs: [
				...state.tabs,
				tab
			]
		})),

		removeSession: (tabId) => set((state) => {
			const index = state.tabs.findIndex((tab) => tab.id === tabId);
			return {
				tabs: index >= 0 ? state.tabs.splice(index, 1) : state.tabs,
				activeTab: state.activeTab == tabId ? null : state.activeTab,
			};
		}),

		updateSession: (payload) => set((state) => ({
			tabs: state.tabs.map((tab) =>
				tab.id === payload.id
					? { ...tab, ...payload, }
					: tab
			)
		})),

		updateCurrentSession: (modifier) => set((state) => updateCurrentSession(state, modifier)),
		setSessions: (tabs) => set(() => ({ tabs })),
		setActiveSession: (activeTab) => set(() => ({ activeTab })),
		setActiveView: (activeView) => set(() => ({ activeView })),
		addQueryTab: (query) => set((state) => updateCurrentSession(state, (tab) => {
			const newId = tab.lastQueryId + 1;
			tab.queries.push({ id: newId, text: query ?? "" });
			tab.activeQueryId = newId;
			tab.lastQueryId = newId;
			return tab;
		})),

		removeQueryTab: (queryId) => set((state) => updateCurrentSession(state, (tab) => {
			const index = tab.queries.findIndex((query) => query.id === queryId);
			if (index < 1) return tab;

			if (tab.activeQueryId === queryId) {
				tab.activeQueryId = tab.queries[index - 1]?.id || 1;
			}

			tab.queries.splice(index, 1);

			if (tab.queries.length <= 1) {
				tab.activeQueryId = 1;
				tab.lastQueryId = 1;
			}

			return tab;
		})),

		updateQueryTab: (payload) => set((state) => updateCurrentSession(state, (tab) => {
			const index = tab.queries.findIndex((query) => query.id === tab.activeQueryId);
			if (index < 0) return tab;

			tab.queries[index] = {
				...tab.queries[index],
				...payload
			};

			return tab;
		})),

		setActiveQueryTab: (tabId) => set((state) => updateCurrentSession(state, (tab) => ({
			...tab,
			activeQueryId: tabId,
		}))),

		setWindowPinned: (isPinned) => set(() => ({ isPinned })),

		toggleWindowPinned: () => set((state) => ({
			isPinned: !state.isPinned,
		})),

		addHistoryEntry: (entry: HistoryEntry) => set((state) => {
			const query = entry.query;

			if (query.length === 0) return {};
			if (state.queryHistory[0]?.query === query) return {};

			return [
				entry,
				...state.queryHistory.slice(0, 49),
			];
		}),

		clearHistory: () => set(() => ({
			queryHistory: [],
		})),

		removeHistoryEntry: (entryId) => set((state) => ({
			queryHistory: state.queryHistory.filter((entry) => entry.id !== entryId),
		})),

		saveFavoritesEntry: (favorite) => set((state) => {
			const queryFavorites = state.queryFavorites;
			const index = state.queryFavorites.findIndex((entry) => entry.id === favorite.id);

			if (index < 0) {
				state.queryFavorites.push(favorite);
			} else {
				state.queryFavorites[index] = favorite;
			}

			return { queryFavorites };
		}),

		removeFavoritesEntry: (favoriteId) => set((state) => ({
			queryFavorites: state.queryFavorites.filter((entry) => entry.id !== favoriteId),
		})),

		setFavorites: (queryFavorites) => set(() => ({
			queryFavorites,
		})),

		setConsoleEnabled: (enableConsole) => set(() => ({ enableConsole })),
		setSurrealUser: (surrealUser) => set(() => ({ surrealUser })),
		setSurrealPass: (surrealPass) => set(() => ({ surrealPass })),
		setSurrealPort: (surrealPort) => set(() => ({ surrealPort })),
		setLocalDatabaseDriver: (localDriver) => set(() => ({ localDriver })),
		setLocalDatabaseStorage: (localStorage) => set(() => ({ localStorage })),
		setSurrealPath: (surrealPath) => set(() => ({ surrealPath })),
		setQueryTimeout: (queryTimeout) => set(() => ({ queryTimeout })),
		setUpdateChecker: (updateChecker) => set(() => ({ updateChecker })),
		setLastPromptedVersion: (lastPromptedVersion) => set(() => ({ lastPromptedVersion })),
		setShowQueryListing: (enableListing) => set(() => ({ enableListing })),
		setQueryListingMode: (queryListing) => set(() => ({ queryListing })),
		setResultListingMode: (resultListing) => set(() => ({ resultListing })),

		increaseFontZoomLevel: () => set((state) => ({
			fontZoomLevel: Math.min(state.fontZoomLevel + 0.1, 2),
		})),

		decreaseFontZoomLevel: () => set((state) => ({
			fontZoomLevel: Math.max(state.fontZoomLevel - 0.1, 0.5),
		})),

		resetFontZoomLevel: () => set(() => ({
			fontZoomLevel: 1,
		})),

		setDesignerLayoutMode: (defaultDesignerLayoutMode) => set(() => ({ defaultDesignerLayoutMode })),
		setDesignerNodeMode: (defaultDesignerNodeMode) => set(() => ({ defaultDesignerNodeMode })),

		toggleTablePin: (pin) => set((state) => ({
			tabs: state.tabs.map((tab) =>
				tab.id == pin.session
					? ({
						...tab,
						pinnedTables:
							tab.pinnedTables.includes(pin.table)
								? tab.pinnedTables.splice(tab.pinnedTables.indexOf(pin.table), 1)
								: [...tab.pinnedTables, pin.table]
					})
					: tab
			)
		})),

		softReset: () => set(() => ({
			activeView: "query",
		}))
	}), 
	{
		name: 'surrealist-config',
		storage: createJSONStorage(() => adapterStorage),
	}
));