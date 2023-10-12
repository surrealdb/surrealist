import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useSelector } from "react-redux";
import { configReducer } from "./stores/config";
import { databaseReducer } from "./stores/database";
import { interfaceReducer } from "./stores/interface";
import { explorerReducer } from "./stores/explorer";
import { designerReducer } from "./stores/designer";

export const store = configureStore({
	reducer: {
		config: configReducer,
		database: databaseReducer,
		interface: interfaceReducer,
		explorer: explorerReducer,
		designer: designerReducer,
	}
});

export type StoreState = ReturnType<typeof store.getState>;
export type StoreActions = typeof store.dispatch;

export const useStoreValue: TypedUseSelectorHook<StoreState> = useSelector;
