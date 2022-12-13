import { TogglePinned } from "$/go/main/App";
import { ColorScheme } from "@mantine/core";
import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useSelector } from "react-redux";
import { SurrealistTab } from "./typings";

const mainSlice = createSlice({
	name: 'main',
	initialState: {
		colorScheme: 'light' as ColorScheme,
		knownTabs: [] as SurrealistTab[],
		activeTab: null as string|null,
		isPinned: false,
		results: [] as any,
	},
	reducers: {
		initialize(state, action: PayloadAction<any>) {
			const config = JSON.parse(action.payload.trim());

			state.colorScheme = config.theme;
			state.knownTabs = config.tabs;
		},

		setColorScheme(state, action: PayloadAction<ColorScheme>) {
			state.colorScheme = action.payload;
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
			TogglePinned();
		},

		setResults(state, action: PayloadAction<any>) {
			state.results = action.payload;
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