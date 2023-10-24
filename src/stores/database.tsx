import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { DatabaseSchema } from "~/types";
import { printLog } from "~/util/helpers";

const databaseSlice = createSlice({
	name: "database",
	initialState: {
		isServing: false,
		servePending: false,
		isConnecting: false,
		isConnected: false,
		isQueryActive: false,
		consoleOutput: [] as string[],
		databaseSchema: null as DatabaseSchema | null
	},
	reducers: {

		setQueryActive(state, action: PayloadAction<boolean>) {
			state.isQueryActive = action.payload;
		},

		clearSchema(state) {
			state.databaseSchema = null;
		},

		prepareServe(state) {
			state.servePending = true;
			state.consoleOutput = [];
		},

		confirmServing(state) {
			state.isServing = true;
			state.servePending = false;
		},

		stopServing(state) {
			state.isServing = false;
			state.servePending = false;
		},

		cancelServe(state) {
			state.servePending = true;
		},

		pushConsoleLine(state, action: PayloadAction<string>) {
			state.consoleOutput.push(action.payload);

			if (state.consoleOutput.length > 250) {
				state.consoleOutput.shift();
			}
		},

		clearConsole(state) {
			state.consoleOutput = [];
		},

		setDatabaseSchema(state, action: PayloadAction<DatabaseSchema>) {
			printLog("Received database schema", "#e600a4", action.payload);
			
			state.databaseSchema = action.payload;
		},

		setIsConnecting(state, action: PayloadAction<boolean>) {
			state.isConnecting = action.payload;
		},

		setIsConnected(state, action: PayloadAction<boolean>) {
			state.isConnected = action.payload;

			if (!action.payload) {
				state.databaseSchema = null;
			}
		},

	}
});

export const databaseReducer = databaseSlice.reducer;

export const {
	setQueryActive,
	clearSchema,
	prepareServe,
	confirmServing,
	stopServing,
	cancelServe,
	pushConsoleLine,
	clearConsole,
	setDatabaseSchema,
	setIsConnecting,
	setIsConnected,
} = databaseSlice.actions;