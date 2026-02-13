import { EditorStateSnapshot } from "@surrealdb/ui";
import { omit } from "radash";
import { create } from "zustand";

export type QueryStore = {
	queryState: Record<string, EditorStateSnapshot>;
	isQueryValid: boolean;

	updateQueryState: (key: string, state: EditorStateSnapshot) => void;
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
