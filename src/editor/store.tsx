import type { Extension, StateEffectType } from "@codemirror/state";
import { ViewPlugin } from "@codemirror/view";
import type { StoreApi, UseBoundStore } from "zustand";
import { watchStore } from "~/util/config";

/**
 * An editor extension which listens to a store update and dispatches
 * a state effect
 * @param options
 * @returns
 */
export function storeWatcher<T, S extends UseBoundStore<StoreApi<any>>>(options: {
	initial?: boolean;
	store: S;
	select: (slice: ReturnType<S["getState"]>) => T;
	effect: StateEffectType<T>;
}): Extension {
	return ViewPlugin.define((view) => ({
		destroy: watchStore({
			initial: options.initial,
			store: options.store,
			select: options.select,
			then: (value) => {
				return view.dispatch({ effects: options.effect.of(value) });
			},
		}),
	}));
}
