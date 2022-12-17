import { HistoryEntry, SurrealistTab } from "./typings";
import { PayloadAction, configureStore, createSlice } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useSelector } from "react-redux";

import { ThemeOption } from "./util/theme";

const mainSlice = createSlice({
	name: 'main',
	initialState: {
		colorScheme: 'automatic' as ThemeOption,
		knownTabs: [] as SurrealistTab[],
		activeTab: null as string|null,
		isPinned: false,
		autoConnect: true,
		tableSuggest: true,
		wordWrap: true,
		history: [] as HistoryEntry[],
		isServing: false,
		servePending: false,
		servingTab: null as string|null,
		localDriver: 'memory',
		localStorage: '',
	},
	reducers: {
		initialize(state, action: PayloadAction<any>) {
			const config = JSON.parse(action.payload.trim());

			state.colorScheme = config.theme || 'automatic';
			state.knownTabs = config.tabs || [];
			state.autoConnect = config.autoConnect ?? true;
			state.tableSuggest = config.tableSuggest ?? true;
			state.wordWrap = config.wordWrap ?? true;
			state.history = config.history || [];
			state.localDriver = config.localDriver || 'memory';
			state.localStorage = config.localStorage || '';
		},

		setColorScheme(state, action: PayloadAction<ThemeOption>) {
			state.colorScheme = action.payload;
		},

		setAutoConnect(state, action: PayloadAction<boolean>) {
			state.autoConnect = action.payload;
		},
		
		setTableSuggest(state, action: PayloadAction<boolean>) {
			state.tableSuggest = action.payload;
		},

		setWordWrap(state, action: PayloadAction<boolean>) {
			state.wordWrap = action.payload;
		},

		addTab(state, action: PayloadAction<SurrealistTab>) {
			state.knownTabs.push(action.payload);
		},

		removeTab(state, action: PayloadAction<string>) {
			state.knownTabs = state.knownTabs.filter(tab => tab.id !== action.payload);

			if (state.activeTab === action.payload) {
				if (state.knownTabs.length === 0) {
					state.activeTab = null;
				} else {
					const firstTab = state.knownTabs[0];

					state.activeTab = firstTab.id;
				}
			}
		},

		updateTab(state, action: PayloadAction<Partial<SurrealistTab>>) {
			const tabIndex = state.knownTabs.findIndex(tab => tab.id === action.payload.id);

			if (tabIndex >= 0) {
				const tab = state.knownTabs[tabIndex];

				state.knownTabs[tabIndex] = { ...tab, ...action.payload };
			}
		},

		setActiveTab(state, action: PayloadAction<string>) {
			state.activeTab = action.payload;
		},
		
		togglePinned(state) {
			state.isPinned = !state.isPinned;
		},

		addHistoryEntry(state, action: PayloadAction<HistoryEntry>) {
			if (state.history.length > 0 && state.history[0].query === action.payload.query) {
				return;
			}
			
			state.history.unshift(action.payload);

			if (state.history.length > 50) {
				state.history.pop();
			}
		},

		clearHistory(state) {
			state.history = [];
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
		},

		setLocalDatabaseDriver(state, action: PayloadAction<string>) {
			state.localDriver = action.payload;
		},

		setLocalDatabaseStorage(state, action: PayloadAction<string>) {
			state.localStorage = action.payload;
		}
		
	}
});


export const actions = mainSlice.actions;
export const store = configureStore({
	reducer: mainSlice.reducer
});

export type StoreState = ReturnType<typeof store.getState>
export type StoreActions = typeof store.dispatch

export const useStoreValue: TypedUseSelectorHook<StoreState> = useSelector