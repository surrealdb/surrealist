import { ColorScheme } from "@mantine/core";
import { configureStore, createSlice } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useSelector } from "react-redux";

const mainSlice = createSlice({
	name: 'main',
	initialState: {	
		colorScheme: 'light' as ColorScheme
	},
	reducers: {

	}
});

export const store = configureStore({
	reducer: mainSlice.reducer
});

export type StoreState = ReturnType<typeof store.getState>
export type StoreActions = typeof store.dispatch

export const useStoreValue: TypedUseSelectorHook<StoreState> = useSelector