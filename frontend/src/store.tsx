import {HistoryEntry, SurrealistTab, ConsoleOutputMessage, SurrealistConfig, DriverType} from "./typings";
import { PayloadAction, configureStore, createSlice } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useSelector } from "react-redux";

import { ThemeOption } from "./util/theme";
import { BASE_CONFIG } from "./util/config";

const mainSlice = createSlice({
	name: 'main',
	initialState: {
		config: BASE_CONFIG as SurrealistConfig,
		activeTab: null as string|null,
		isPinned: false,
		isServing: false,
		servePending: false,
		servingTab: null as string|null,
		consoleOutput: [] as ConsoleOutputMessage[],
		availableUpdate: '',
		showAvailableUpdate: false,
	},
	reducers: {
		initialize(state, action: PayloadAction<any>) {
			state.consoleOutput = [];
			state.config = {
				...BASE_CONFIG,
				...JSON.parse(action.payload.trim())
			};
		},

		setColorScheme(state, action: PayloadAction<ThemeOption>) {
			state.config.theme = action.payload;
		},

		setAutoConnect(state, action: PayloadAction<boolean>) {
			state.config.autoConnect = action.payload;
		},

		setTableSuggest(state, action: PayloadAction<boolean>) {
			state.config.tableSuggest = action.payload;
		},

		setWordWrap(state, action: PayloadAction<boolean>) {
			state.config.wordWrap = action.payload;
		},

		addTab(state, action: PayloadAction<SurrealistTab>) {
			state.config.tabs.push(action.payload);
		},

		removeTab(state, action: PayloadAction<string>) {
			state.config.tabs = state.config.tabs.filter(tab => tab.id !== action.payload);

			if (state.activeTab === action.payload) {
				if (state.config.tabs.length === 0) {
					state.activeTab = null;
				} else {
					const firstTab = state.config.tabs[0];

					state.activeTab = firstTab.id;
				}
			}
		},

		updateTab(state, action: PayloadAction<Partial<SurrealistTab>>) {
			const tabIndex = state.config.tabs.findIndex(tab => tab.id === action.payload.id);

			if (tabIndex >= 0) {
				const tab = state.config.tabs[tabIndex];

				state.config.tabs[tabIndex] = { ...tab, ...action.payload };
			}
		},

		setActiveTab(state, action: PayloadAction<string>) {
			state.activeTab = action.payload;
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

		prepareServe(state, action: PayloadAction<string>) {
			state.servingTab = action.payload;
			state.servePending = true;
		},

		confirmServing(state) {
			state.isServing = true;
			state.servePending = false;
		},

		stopServing(state) {
			state.isServing = false;
			state.servePending = false;
			state.servingTab = null;
			state.consoleOutput = [];
		},

		setConsoleEnabled(state, action: PayloadAction<boolean>) {
			state.config.enableConsole = action.payload;
		},

		pushConsoleLine(state, action: PayloadAction<ConsoleOutputMessage>) {
			state.consoleOutput.push({
				kind: action.payload.kind,
				message: action.payload.message,
			});

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

		setQueryTimeout(state, action: PayloadAction<number>) {
			state.config.queryTimeout = action.payload;
		},

		setUpdateChecker(state, action: PayloadAction<boolean>) {
			state.config.updateChecker = action.payload;
		},

		setAvailableUpdate(state, action: PayloadAction<string>) {
			state.showAvailableUpdate = true;
			state.availableUpdate = action.payload;
		},

		hideAvailableUpdate(state) {
			state.showAvailableUpdate = false;
		},

		setShowHistory(state, action: PayloadAction<boolean>) {
			state.config.enableHistory = action.payload;
		},

	}
});


export const actions = mainSlice.actions;
export const store = configureStore({
	reducer: mainSlice.reducer
});

export type StoreState = ReturnType<typeof store.getState>
export type StoreActions = typeof store.dispatch

export const useStoreValue: TypedUseSelectorHook<StoreState> = useSelector
