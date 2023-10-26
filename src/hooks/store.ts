import { StoreState, store, useStoreValue } from "~/store";
import { useStable } from "./stable";
import { PayloadAction } from "@reduxjs/toolkit";
import { ChangeEvent } from "react";

function isEvent(event: any): event is ChangeEvent<any> {
	return event && event.currentTarget && typeof event.currentTarget.value === 'string';
}

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

	const setValue = useStable((value: T | ChangeEvent<any>) => {
		const actual = isEvent(value)
			? value.currentTarget.value
			: value;

		store.dispatch(updater(actual));
	});

	return [value, setValue] as const;
}