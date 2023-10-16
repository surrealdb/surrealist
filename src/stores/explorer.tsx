import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface ActiveRecord {
	invalid?: true;
	content: any;
	inputs: [];
	outputs: [];
}

const explorerSlice = createSlice({
	name: "explorer",
	initialState: {
		activeTable: null as string | null,
		records: [] as any[],
		recordCount: 0,
		filtering: false,
		filter: '',
		editingRecord: null as any,
		isCreating: false,
		isEditing: false,
		recordHistory: [] as any[],
		historyIndex: 0,
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

		openCreator(state) {
			state.isEditing = false;
			state.isCreating = true;
		},

		openEditor(state, action: PayloadAction<any>) {
			state.editingRecord = action.payload;
			state.isEditing = true;
			state.isCreating = false;
		},

		closeRecord(state) {
			state.isCreating = false;
			state.isEditing = false;
		},

		setHistory(state, action: PayloadAction<any[]>) {
			state.recordHistory = action.payload;
		},

		setHistoryIndex(state, action: PayloadAction<number>) {
			state.historyIndex = action.payload;
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
	openCreator,
	openEditor,
	closeRecord,
	setHistory,
	setHistoryIndex,
} = explorerSlice.actions;