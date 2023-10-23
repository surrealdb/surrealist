import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface ActiveRecord {
	exists: boolean;
	content: any;
	inputs: [];
	outputs: [];
	initial: string;
}

const explorerSlice = createSlice({
	name: "explorer",
	initialState: {
		activeTable: null as string | null,
		records: [] as any[],
		recordCount: 0,
		filtering: false,
		filter: '',
		isCreating: false,
		creatorId: '',
		creatorBody: '',
		isEditing: false,
		recordHistory: [] as string[],
		activeRecord: null as ActiveRecord | null,
		inspectorId: '',
		inspectorQuery: '',
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

		openCreator(state, action: PayloadAction<string>) {
			state.isEditing = false;
			state.isCreating = true;
			state.creatorId = action.payload;
			state.creatorBody = '{\n    \n}';
		},

		setCreatorId(state, action: PayloadAction<string>) {
			state.creatorId = action.payload;
		},

		setCreatorBody(state, action: PayloadAction<string>) {
			state.creatorBody = action.payload;
		},

		openEditor(state) {
			state.isEditing = true;
			state.isCreating = false;
		},

		closeEditor(state) {
			state.isCreating = false;
			state.isEditing = false;
			state.activeRecord = null;
			state.recordHistory = [];
			state.inspectorId = '';
			state.inspectorQuery = '';
		},

		setHistory(state, action: PayloadAction<string[]>) {
			state.recordHistory = action.payload;
		},

		setActiveRecord(state, action: PayloadAction<ActiveRecord | null>) {
			state.activeRecord = action.payload;
		},

		setInspectorId(state, action: PayloadAction<string>) {
			state.inspectorId = action.payload;
		},

		setInspectorQuery(state, action: PayloadAction<string>) {
			state.inspectorQuery = action.payload;
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
	setCreatorId,
	setCreatorBody,
	openEditor,
	closeEditor,
	setHistory,
	setActiveRecord,
	setInspectorId,
	setInspectorQuery,
} = explorerSlice.actions;