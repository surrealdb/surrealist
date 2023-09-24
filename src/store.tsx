import {
	HistoryEntry,
	Session,
	SurrealistConfig,
	DriverType,
	QueryListing,
	FavoritesEntry,
	ResultListing,
	TableDefinition,
	Open,
	SurrealistEnvironment,
	TabCreation,
	TablePinAction,
	DesignerLayoutMode,
	DesignerNodeMode,
	SessionQuery,
} from "./types";

import { PayloadAction, configureStore, createSlice } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useSelector } from "react-redux";
import { ColorScheme } from "@mantine/core";
import { ThemeOption } from "./util/theme";
import { createBaseConfig } from "./util/defaults";
import { migrateConfig } from "./util/migration";
import { newId } from "./util/helpers";

function getSession(state: StoreState) {
	const session = state.config.tabs.find((tab) => tab.id === state.config.activeTab);

	if (!session) {
		throw new Error("Session unavailable");
	}

	return session;
}

const mainSlice = createSlice({
	name: "main",
	initialState: {
		config: createBaseConfig(),
		nativeTheme: "light" as ColorScheme,
		isServing: false,
		servePending: false,
		isConnecting: false,
		isConnected: false,
		isQueryActive: false,
		consoleOutput: [] as string[],
		availableUpdate: "",
		showAvailableUpdate: false,
		databaseSchema: [] as TableDefinition[],
		showTabCreator: false,
		tabCreation: null as TabCreation | null,
		showTabEditor: false,
		monacoLoaded: false,
		editingId: "",
	},
	reducers: {
		initialize(state, action: PayloadAction<any>) {
			const theConfig: Open<SurrealistConfig> = {
				...createBaseConfig(),
				...JSON.parse(action.payload.trim()),
			};

			if (theConfig.environments.length === 0) {
				theConfig.environments.push({
					id: newId(),
					name: "Default",
					connection: {},
				});
			}

			migrateConfig(theConfig);

			state.consoleOutput = [];
			state.config = theConfig;
		},

		setColorScheme(state, action: PayloadAction<ThemeOption>) {
			state.config.theme = action.payload;
		},

		setNativeTheme(state, action: PayloadAction<ColorScheme>) {
			state.nativeTheme = action.payload;
		},

		setAutoConnect(state, action: PayloadAction<boolean>) {
			state.config.autoConnect = action.payload;
		},

		setTableSuggest(state, action: PayloadAction<boolean>) {
			state.config.tableSuggest = action.payload;
		},

		setErrorChecking(state, action: PayloadAction<boolean>) {
			state.config.errorChecking = action.payload;
		},

		setWordWrap(state, action: PayloadAction<boolean>) {
			state.config.wordWrap = action.payload;
		},

		setQueryActive(state, action: PayloadAction<boolean>) {
			state.isQueryActive = action.payload;
		},

		setSessionSearch(state, action: PayloadAction<boolean>) {
			state.config.tabSearch = action.payload;
		},

		setEnvironments(state, action: PayloadAction<SurrealistEnvironment[]>) {
			state.config.environments = action.payload;
		},

		addSession(state, { payload }: PayloadAction<Session>) {
			state.config.tabs.push(payload);
		},

		removeSession(state, action: PayloadAction<string>) {
			const index = state.config.tabs.findIndex((tab) => tab.id === action.payload);

			if (index >= 0) {
				state.config.tabs.splice(index, 1);
			}

			if (state.config.activeTab === action.payload) {
				state.config.activeTab = null;
			}
		},

		updateSession(state, { payload }: PayloadAction<Partial<Session>>) {
			const sessionIndex = state.config.tabs.findIndex((tab) => tab.id === payload.id);

			if (sessionIndex >= 0) {
				const session = state.config.tabs[sessionIndex];

				state.config.tabs[sessionIndex] = { ...session, ...payload };
			}
		},

		setSessions(state, action: PayloadAction<Session[]>) {
			state.config.tabs = action.payload;
		},

		setActiveSession(state, action: PayloadAction<string>) {
			state.config.activeTab = action.payload;
			state.databaseSchema = [];
		},

		addQueryTab(state) {
			const session = getSession(state);
			const newId = session.lastQueryId + 1;

			session.queries.push({ id: newId, text: "" });
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
				session.activeQueryId = 0;
			}

			session.queries.splice(index, 1);

			if (session.queries.length <= 1) {
				session.activeQueryId = 1;
				session.lastQueryId = 1;
			}
		},

		updateQueryTab(state, action: PayloadAction<Partial<SessionQuery>>) {
			const session = getSession(state);
			const index = session.queries.findIndex((query) => query.id === action.payload.id);

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
			state.config.isPinned = payload;
		},

		toggleWindowPinned(state) {
			state.config.isPinned = !state.config.isPinned;
		},

		addHistoryEntry(state, action: PayloadAction<HistoryEntry>) {
			const query = action.payload.query;

			if (
				query.length === 0 ||
				(state.config.queryHistory.length > 0 && state.config.queryHistory[0].query === query)
			) {
				return;
			}

			state.config.queryHistory.unshift(action.payload);

			if (state.config.queryHistory.length > 50) {
				state.config.queryHistory.pop();
			}
		},

		clearHistory(state) {
			state.config.queryHistory = [];
		},

		removeHistoryEntry(state, action: PayloadAction<string>) {
			state.config.queryHistory = state.config.queryHistory.filter((entry) => entry.id !== action.payload);
		},

		saveFavoritesEntry(state, action: PayloadAction<FavoritesEntry>) {
			const index = state.config.queryFavorites.findIndex((entry) => entry.id === action.payload.id);

			if (index < 0) {
				state.config.queryFavorites.push(action.payload);
			} else {
				state.config.queryFavorites[index] = action.payload;
			}
		},

		removeFavoritesEntry(state, action: PayloadAction<string>) {
			state.config.queryFavorites = state.config.queryFavorites.filter((entry) => entry.id !== action.payload);
		},

		setFavorites(state, action: PayloadAction<FavoritesEntry[]>) {
			state.config.queryFavorites = action.payload;
		},

		prepareServe(state) {
			state.servePending = true;
			state.consoleOutput = [];
		},

		confirmServing(state) {
			state.isServing = true;
			state.servePending = false;
		},

		stopServing(state) {
			state.isServing = false;
			state.servePending = false;
		},

		cancelServe(state) {
			state.servePending = true;
		},

		setConsoleEnabled(state, action: PayloadAction<boolean>) {
			state.config.enableConsole = action.payload;
		},

		setSurrealUser(state, action: PayloadAction<string>) {
			state.config.surrealUser = action.payload;
		},

		setSurrealPass(state, action: PayloadAction<string>) {
			state.config.surrealPass = action.payload;
		},

		setSurrealPort(state, action: PayloadAction<number>) {
			state.config.surrealPort = action.payload;
		},

		pushConsoleLine(state, action: PayloadAction<string>) {
			state.consoleOutput.push(action.payload);

			if (state.consoleOutput.length > 250) {
				state.consoleOutput.shift();
			}
		},

		clearConsole(state) {
			state.consoleOutput = [];
		},

		setLocalDatabaseDriver(state, action: PayloadAction<DriverType>) {
			state.config.localDriver = action.payload;
		},

		setLocalDatabaseStorage(state, action: PayloadAction<string>) {
			state.config.localStorage = action.payload;
		},

		setSurrealPath(state, action: PayloadAction<string>) {
			state.config.surrealPath = action.payload;
		},

		setQueryTimeout(state, action: PayloadAction<number>) {
			state.config.queryTimeout = action.payload;
		},

		setUpdateChecker(state, action: PayloadAction<boolean>) {
			state.config.updateChecker = action.payload;
		},

		setAvailableUpdate(state, action: PayloadAction<string>) {
			state.showAvailableUpdate = true;
			state.availableUpdate = action.payload;
			state.config.lastPromptedVersion = action.payload;
		},

		hideAvailableUpdate(state) {
			state.showAvailableUpdate = false;
		},

		setShowQueryListing(state, action: PayloadAction<boolean>) {
			state.config.enableListing = action.payload;
		},

		setQueryListingMode(state, action: PayloadAction<QueryListing>) {
			state.config.queryListing = action.payload;
		},

		setResultListingMode(state, action: PayloadAction<ResultListing>) {
			state.config.resultListing = action.payload;
		},

		increaseFontZoomLevel(state) {
			state.config.fontZoomLevel = Math.min(state.config.fontZoomLevel + 0.1, 2);
		},

		decreaseFontZoomLevel(state) {
			state.config.fontZoomLevel = Math.max(state.config.fontZoomLevel - 0.1, 0.5);
		},

		resetFontZoomLevel(state) {
			state.config.fontZoomLevel = 1;
		},

		setDesignerLayoutMode(state, action: PayloadAction<DesignerLayoutMode>) {
			state.config.defaultDesignerLayoutMode = action.payload;
		},

		setDesignerNodeMode(state, action: PayloadAction<DesignerNodeMode>) {
			state.config.defaultDesignerNodeMode = action.payload;
		},

		setDatabaseSchema(state, action: PayloadAction<TableDefinition[]>) {
			state.databaseSchema = action.payload;
		},

		setIsConnecting(state, action: PayloadAction<boolean>) {
			state.isConnecting = action.payload;
		},

		setIsConnected(state, action: PayloadAction<boolean>) {
			state.isConnected = action.payload;

			if (!action.payload) {
				state.databaseSchema = [];
			}
		},

		openTabCreator(state, action: PayloadAction<TabCreation>) {
			state.showTabCreator = true;
			state.tabCreation = action.payload;
		},

		closeTabCreator(state) {
			state.showTabCreator = false;
		},

		openTabEditor(state, action: PayloadAction<string>) {
			state.showTabEditor = true;
			state.editingId = action.payload;
		},

		closeTabEditor(state) {
			state.showTabEditor = false;
		},

		setMonacoLoaded(state) {
			state.monacoLoaded = true;
		},

		toggleTablePin(state, action: PayloadAction<TablePinAction>) {
			const pinned = state.config.tabs.find((tab) => tab.id === action.payload.session)?.pinnedTables;

			if (!pinned) {
				return;
			}

			if (pinned.includes(action.payload.table)) {
				pinned.splice(pinned.indexOf(action.payload.table), 1);
			} else {
				pinned.push(action.payload.table);
			}
		},
	},
});

export const actions = mainSlice.actions;
export const store = configureStore({
	reducer: mainSlice.reducer,
});

export type StoreState = ReturnType<typeof store.getState>;
export type StoreActions = typeof store.dispatch;

export const useStoreValue: TypedUseSelectorHook<StoreState> = useSelector;
