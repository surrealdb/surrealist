import { DesignerLayoutMode, DesignerNodeMode, DriverType, FavoritesEntry, HistoryEntry, Open, QueryListing, ResultListing, SessionQuery, SurrealistConfig, SurrealistEnvironment, SurrealistSession, TablePinAction } from "~/types";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { createBaseConfig } from "~/util/defaults";
import { migrateConfig } from "~/util/migration";
import { ThemeOption } from "~/util/theme";

type ConfigState = ReturnType<typeof configSlice.getInitialState>;

function getSession(state: ConfigState) {
	const session = state.tabs.find((tab) => tab.id === state.activeTab);
 
	if (!session) {
		throw new Error("Session unavailable");
	}

	return session;
}

const configSlice = createSlice({
	name: "config",
	initialState: createBaseConfig(),
	reducers: {

		initialize(state, action: PayloadAction<any>) {
			const config: Open<SurrealistConfig> = {
				...createBaseConfig(),
				...JSON.parse(action.payload.trim()),
			};

			migrateConfig(config);

			Object.assign(state, config);
		},

		setColorScheme(state, action: PayloadAction<ThemeOption>) {
			state.theme = action.payload;
		},

		setAutoConnect(state, action: PayloadAction<boolean>) {
			state.autoConnect = action.payload;
		},

		setTableSuggest(state, action: PayloadAction<boolean>) {
			state.tableSuggest = action.payload;
		},

		setErrorChecking(state, action: PayloadAction<boolean>) {
			state.errorChecking = action.payload;
		},

		setWordWrap(state, action: PayloadAction<boolean>) {
			state.wordWrap = action.payload;
		},

		setSessionSearch(state, action: PayloadAction<boolean>) {
			state.tabSearch = action.payload;
		},

		setEnvironments(state, action: PayloadAction<SurrealistEnvironment[]>) {
			state.environments = action.payload;
		},

		addSession(state, { payload }: PayloadAction<SurrealistSession>) {
			state.tabs.push(payload);
		},

		removeSession(state, action: PayloadAction<string>) {
			const index = state.tabs.findIndex((tab) => tab.id === action.payload);

			if (index >= 0) {
				state.tabs.splice(index, 1);
			}

			if (state.activeTab === action.payload) {
				state.activeTab = null;
			}
		},

		updateSession(state, { payload }: PayloadAction<Partial<SurrealistSession>>) {
			const sessionIndex = state.tabs.findIndex((tab) => tab.id === payload.id);

			if (sessionIndex >= 0) {
				const session = state.tabs[sessionIndex];

				state.tabs[sessionIndex] = { ...session, ...payload };
			}
		},

		setSessions(state, action: PayloadAction<SurrealistSession[]>) {
			state.tabs = action.payload;
		},

		setActiveSession(state, action: PayloadAction<string>) {
			state.activeTab = action.payload;
		},

		setActiveURL(state, action: PayloadAction<string>) {
			state.activeUrl = action.payload;
		},

		addQueryTab(state, { payload }: PayloadAction<string | undefined>) {
			const session = getSession(state);
			const newId = session.lastQueryId + 1;

			session.queries.push({ id: newId, text: payload || "" });
			session.activeQueryId = newId;
			session.lastQueryId = newId;
		},

		removeQueryTab(state, action: PayloadAction<number>) {
			const session = getSession(state);
			const index = session.queries.findIndex((query) => query.id === action.payload);

			if (index < 1) {
				return;
			}

			if (session.activeQueryId === action.payload) {
				session.activeQueryId = session.queries[index - 1]?.id || 1;
			}

			session.queries.splice(index, 1);

			if (session.queries.length <= 1) {
				session.activeQueryId = 1;
				session.lastQueryId = 1;
			}
		},

		updateQueryTab(state, action: PayloadAction<Partial<SessionQuery>>) {
			const session = getSession(state);
			const index = session.queries.findIndex((query) => query.id === session.activeQueryId);

			if (index < 0) {
				return;
			}

			session.queries[index] = {
				...session.queries[index],
				...action.payload
			};
		},

		setActiveQueryTab(state, action: PayloadAction<number>) {
			const session = getSession(state);

			session.activeQueryId = action.payload;
		},

		setWindowPinned(state, { payload }: PayloadAction<boolean>) {
			state.isPinned = payload;
		},

		toggleWindowPinned(state) {
			state.isPinned = !state.isPinned;
		},

		addHistoryEntry(state, action: PayloadAction<HistoryEntry>) {
			const query = action.payload.query;

			if (
				query.length === 0 ||
				(state.queryHistory.length > 0 && state.queryHistory[0].query === query)
			) {
				return;
			}

			state.queryHistory.unshift(action.payload);

			if (state.queryHistory.length > 50) {
				state.queryHistory.pop();
			}
		},

		clearHistory(state) {
			state.queryHistory = [];
		},

		removeHistoryEntry(state, action: PayloadAction<string>) {
			state.queryHistory = state.queryHistory.filter((entry) => entry.id !== action.payload);
		},

		saveFavoritesEntry(state, action: PayloadAction<FavoritesEntry>) {
			const index = state.queryFavorites.findIndex((entry) => entry.id === action.payload.id);

			if (index < 0) {
				state.queryFavorites.push(action.payload);
			} else {
				state.queryFavorites[index] = action.payload;
			}
		},

		removeFavoritesEntry(state, action: PayloadAction<string>) {
			state.queryFavorites = state.queryFavorites.filter((entry) => entry.id !== action.payload);
		},

		setFavorites(state, action: PayloadAction<FavoritesEntry[]>) {
			state.queryFavorites = action.payload;
		},

		setConsoleEnabled(state, action: PayloadAction<boolean>) {
			state.enableConsole = action.payload;
		},

		setSurrealUser(state, action: PayloadAction<string>) {
			state.surrealUser = action.payload;
		},

		setSurrealPass(state, action: PayloadAction<string>) {
			state.surrealPass = action.payload;
		},

		setSurrealPort(state, action: PayloadAction<number>) {
			state.surrealPort = action.payload;
		},

		setLocalDatabaseDriver(state, action: PayloadAction<DriverType>) {
			state.localDriver = action.payload;
		},

		setLocalDatabaseStorage(state, action: PayloadAction<string>) {
			state.localStorage = action.payload;
		},

		setSurrealPath(state, action: PayloadAction<string>) {
			state.surrealPath = action.payload;
		},

		setQueryTimeout(state, action: PayloadAction<number>) {
			state.queryTimeout = action.payload;
		},

		setUpdateChecker(state, action: PayloadAction<boolean>) {
			state.updateChecker = action.payload;
		},

		setLastPromptedVersion(state, action: PayloadAction<string>) {
			state.lastPromptedVersion = action.payload;
		},

		setShowQueryListing(state, action: PayloadAction<boolean>) {
			state.enableListing = action.payload;
		},

		setQueryListingMode(state, action: PayloadAction<QueryListing>) {
			state.queryListing = action.payload;
		},

		setResultListingMode(state, action: PayloadAction<ResultListing>) {
			state.resultListing = action.payload;
		},

		increaseFontZoomLevel(state) {
			state.fontZoomLevel = Math.min(state.fontZoomLevel + 0.1, 2);
		},

		decreaseFontZoomLevel(state) {
			state.fontZoomLevel = Math.max(state.fontZoomLevel - 0.1, 0.5);
		},

		resetFontZoomLevel(state) {
			state.fontZoomLevel = 1;
		},

		setDesignerLayoutMode(state, action: PayloadAction<DesignerLayoutMode>) {
			state.defaultDesignerLayoutMode = action.payload;
		},

		setDesignerNodeMode(state, action: PayloadAction<DesignerNodeMode>) {
			state.defaultDesignerNodeMode = action.payload;
		},

		toggleTablePin(state, action: PayloadAction<TablePinAction>) {
			const pinned = state.tabs.find((tab) => tab.id === action.payload.session)?.pinnedTables;

			if (!pinned) {
				return;
			}

			if (pinned.includes(action.payload.table)) {
				pinned.splice(pinned.indexOf(action.payload.table), 1);
			} else {
				pinned.push(action.payload.table);
			}
		},

	}
});

export const configReducer = configSlice.reducer;

export const {
	initialize,
	setColorScheme,
	setAutoConnect,
	setTableSuggest,
	setErrorChecking,
	setWordWrap,
	setSessionSearch,
	setEnvironments,
	addSession,
	removeSession,
	updateSession,
	setSessions,
	setActiveSession,
	setActiveURL,
	addQueryTab,
	removeQueryTab,
	updateQueryTab,
	setActiveQueryTab,
	setWindowPinned,
	toggleWindowPinned,
	addHistoryEntry,
	clearHistory,
	removeHistoryEntry,
	saveFavoritesEntry,
	removeFavoritesEntry,
	setFavorites,
	setConsoleEnabled,
	setSurrealUser,
	setSurrealPass,
	setSurrealPort,
	setLocalDatabaseDriver,
	setLocalDatabaseStorage,
	setSurrealPath,
	setQueryTimeout,
	setUpdateChecker,
	setLastPromptedVersion,
	setShowQueryListing,
	setQueryListingMode,
	setResultListingMode,
	increaseFontZoomLevel,
	decreaseFontZoomLevel,
	resetFontZoomLevel,
	setDesignerLayoutMode,
	setDesignerNodeMode,
	toggleTablePin,
} = configSlice.actions;
