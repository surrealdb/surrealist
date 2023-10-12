import { PayloadAction, createSlice } from "@reduxjs/toolkit";

const designerSlice = createSlice({
	name: "designer",
	initialState: {
		activeTable: null as string | null,
	},
	reducers: {
		
		setDesignerTable(state, action: PayloadAction<string | null>) {
			state.activeTable = action.payload;
		},

	}
});

export const designerReducer = designerSlice.reducer;

export const {
	setDesignerTable,
} = designerSlice.actions;