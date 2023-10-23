import { StoreState, store, useStoreValue } from "~/store";
import { useStable } from "./stable";
import { PayloadAction } from "@reduxjs/toolkit";

/**
 * Combined store reading and writing hook
 * 
 * @param selector The state selector
 * @param updater The action generator
 * @returns 
 */
export function useStoreState<T>(
	selector: (state: StoreState) => T,
	updater: (value: T) => PayloadAction<T>
) {
	const value = useStoreValue(selector);

	const setValue = useStable((value: T) => {
		store.dispatch(updater(value));
	});

	return [value, setValue] as const;
}