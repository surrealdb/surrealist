import { omit } from "radash";
import { create } from "zustand";
import { StateSnapshot } from "~/components/CodeEditor";

export type QueryStore = {
	queryState: Record<string, StateSnapshot>;
	isQueryValid: boolean;

	updateQueryState: (key: string, state: StateSnapshot) => void;
	removeQueryState: (key: string) => void;
	setQueryValid: (valid: boolean) => void;
};

export const useQueryStore = create<QueryStore>((set) => ({
	queryState: {},
	isQueryValid: true,

	updateQueryState: (key, value) =>
		set((state) => ({
			queryState: { ...state.queryState, [key]: value },
		})),

	removeQueryState: (key) =>
		set((state) => {
			return { queryState: omit(state.queryState, [key]) };
		}),

	setQueryValid: (valid) => set({ isQueryValid: valid }),
}));
