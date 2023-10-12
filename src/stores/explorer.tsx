import { PayloadAction, createSlice } from "@reduxjs/toolkit";

const explorerSlice = createSlice({
	name: "explorer",
	initialState: {
		activeTable: null as string | null,
		records: [] as any[],
		recordCount: 0,
		filtering: false,
		filter: '',
	},
	reducers: {
		
		setExplorerTable(state, action: PayloadAction<string | null>) {
			state.activeTable = action.payload;
		},

		setExplorerData(state, action: PayloadAction<{ records: any[], count: number }>) {
			state.records = action.payload.records;
			state.recordCount = action.payload.count;
		},

		clearExplorerData(state) {
			state.records = [];
			state.recordCount = 0;
		},

		setExplorerFiltering(state, action: PayloadAction<boolean>) {
			state.filtering = action.payload;
		},

		setExplorerFilter(state, action: PayloadAction<string>) {
			state.filter = action.payload;
		},

	}
});

export const explorerReducer = explorerSlice.reducer;

export const {
	setExplorerTable,
	setExplorerData,
	clearExplorerData,
	setExplorerFiltering,
	setExplorerFilter,
} = explorerSlice.actions;