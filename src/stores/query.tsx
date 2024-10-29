import { create } from "zustand";
import { validateQuery } from "~/util/surrealql";

export type QueryStore = {
	queryBuffer: string;
	isBufferValid: boolean;

	updateQueryBuffer: (queryBuffer: string) => void;
};

export const useQueryStore = create<QueryStore>((set) => ({
	queryBuffer: "",
	isBufferValid: true,

	updateQueryBuffer: (queryBuffer) =>
		set(() => ({
			queryBuffer,
			isBufferValid: !validateQuery(queryBuffer),
		})),
}));
