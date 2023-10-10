import { ColorScheme } from "@mantine/core";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { TabCreation } from "~/types";

const interfaceSlice = createSlice({
	name: "interface",
	initialState: {
		nativeTheme: "light" as ColorScheme,
		availableUpdate: "",
		showAvailableUpdate: false,
		showTabCreator: false,
		tabCreation: null as TabCreation | null,
		showTabEditor: false,
		editingId: "",
	},
	reducers: {
		
		setNativeTheme(state, action: PayloadAction<ColorScheme>) {
			state.nativeTheme = action.payload;
		},

		setAvailableUpdate(state, action: PayloadAction<string>) {
			state.showAvailableUpdate = true;
			state.availableUpdate = action.payload;
		},

		hideAvailableUpdate(state) {
			state.showAvailableUpdate = false;
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

	}
});

export const interfaceReducer = interfaceSlice.reducer;

export const {
	setNativeTheme,
	setAvailableUpdate,
	hideAvailableUpdate,
	openTabCreator,
	closeTabCreator,
	openTabEditor,
	closeTabEditor,
} = interfaceSlice.actions;