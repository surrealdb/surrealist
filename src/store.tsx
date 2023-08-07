import {HistoryEntry, SurrealistTab, SurrealistConfig, DriverType, QueryListing, FavoritesEntry, ResultListing, TableDefinition, Open, SurrealistEnvironment, TabCreation} from "./types";
import { PayloadAction, configureStore, createSlice } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useSelector } from "react-redux";
import { ColorScheme } from "@mantine/core";

import { ThemeOption } from "./util/theme";
import { createBaseConfig } from "./util/config";
import { migrateConfig } from "./util/migration";
import { newId } from "./util/helpers";

const mainSlice = createSlice({
	name: 'main',
	initialState: {
		config: createBaseConfig(),
		nativeTheme: 'light' as ColorScheme,
		isPinned: false,
		isServing: false,
		servePending: false,
		isConnected: false,
		consoleOutput: [] as string[],
		availableUpdate: '',
		showAvailableUpdate: false,
		databaseSchema: [] as TableDefinition[],
		showTabCreator: false,
		tabCreation: null as TabCreation | null,
		showTabEditor: false,
		monacoLoaded: false,
		editingId: ''
	},
	reducers: {
		initialize(state, action: PayloadAction<any>) {
			const theConfig: Open<SurrealistConfig> = {
				...createBaseConfig(),
				...JSON.parse(action.payload.trim())
			};

			if (theConfig.environments.length === 0) {
				theConfig.environments.push({
					id: newId(),
					name: 'Default',
					connection: {}
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

		setTabSearch(state, action: PayloadAction<boolean>) {
			state.config.tabSearch = action.payload;
		},
		
		setEnvironments(state, action: PayloadAction<SurrealistEnvironment[]>) {
			state.config.environments = action.payload;
		},

		addTab(state, action: PayloadAction<SurrealistTab>) {
			state.config.tabs.push(action.payload);
		},

		removeTab(state, action: PayloadAction<string>) {
			const index = state.config.tabs.findIndex(tab => tab.id === action.payload);

			if (index >= 0) {
				state.config.tabs.splice(index, 1);
			}

			if (state.config.activeTab === action.payload) {
				state.config.activeTab = null;
			}
		},

		updateTab(state, action: PayloadAction<Partial<SurrealistTab>>) {
			const tabIndex = state.config.tabs.findIndex(tab => tab.id === action.payload.id);

			if (tabIndex >= 0) {
				const tab = state.config.tabs[tabIndex];

				state.config.tabs[tabIndex] = { ...tab, ...action.payload };
			}
		},

		setTabs(state, action: PayloadAction<SurrealistTab[]>) {
			state.config.tabs = action.payload;
		},

		setActiveTab(state, action: PayloadAction<string>) {
			state.config.activeTab = action.payload;
			state.databaseSchema = [];
		},

		togglePinned(state) {
			state.isPinned = !state.isPinned;
		},

		addHistoryEntry(state, action: PayloadAction<HistoryEntry>) {
			const query = action.payload.query;

			if (query.length === 0 || state.config.queryHistory.length > 0 && state.config.queryHistory[0].query === query) {
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
			state.config.queryHistory = state.config.queryHistory.filter(entry => entry.id !== action.payload);
		},

		saveFavoritesEntry(state, action: PayloadAction<FavoritesEntry>) {
			const index = state.config.queryFavorites.findIndex(entry => entry.id === action.payload.id);

			if (index < 0) {
				state.config.queryFavorites.push(action.payload);
			} else {
				state.config.queryFavorites[index] = action.payload;
			}
		},

		removeFavoritesEntry(state, action: PayloadAction<string>) {
			state.config.queryFavorites = state.config.queryFavorites.filter(entry => entry.id !== action.payload);
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

		setDatabaseSchema(state, action: PayloadAction<TableDefinition[]>) {
			state.databaseSchema = action.payload;
		},

		setIsConnected(state, action: PayloadAction<boolean>) {
			state.isConnected = action.payload;
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
		}

	}
});


export const actions = mainSlice.actions;
export const store = configureStore({
	reducer: mainSlice.reducer
});

export type StoreState = ReturnType<typeof store.getState>
export type StoreActions = typeof store.dispatch

export const useStoreValue: TypedUseSelectorHook<StoreState> = useSelector;
