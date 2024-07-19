import { DatabaseSchema, QueryResponse } from "~/types";
import { create } from 'zustand';
import { createDatabaseSchema } from "~/util/defaults";

export type State = "disconnected" | "connecting" | "retrying" | "connected";

export type DatabaseStore = {
	isServing: boolean;
	servePending: boolean;
	currentState: State;
	latestError: string;
	isQueryActive: boolean;
	consoleOutput: string[];
	databaseSchema: DatabaseSchema;
	version: string;
	responses: Record<string, QueryResponse[]>;

	setQueryActive: (isQueryActive: boolean) => void;
	clearSchema: () => void;
	prepareServe: () => void;
	confirmServing: () => void;
	stopServing: () => void;
	cancelServe: () => void;
	pushConsoleLine: (line: string) => void;
	clearConsole: () => void;
	setDatabaseSchema: (databaseSchema: DatabaseSchema) => void;
	setCurrentState: (currentState: State) => void;
	setLatestError: (latestError: string) => void;
	setVersion: (version: string) => void;
	setQueryResponse: (tab: string, response: QueryResponse[]) => void;
	clearQueryResponse: (tab: string) => void;
};

export const useDatabaseStore = create<DatabaseStore>((set) => ({
	isServing: false,
	servePending: false,
	currentState: "disconnected",
	latestError: "",
	isQueryActive: false,
	consoleOutput: [],
	databaseSchema: createDatabaseSchema(),
	version: "",
	responses: {},

	setQueryActive: (isQueryActive) => set(() => ({
		isQueryActive
	})),

	clearSchema: () => set(() => ({
		databaseSchema: createDatabaseSchema(),
	})),

	prepareServe: () => set(() => ({
		servePending: true,
		consoleOutput: [],
	})),

	confirmServing: () => set(() => ({
		isServing: true,
		servePending: false,
	})),

	stopServing: () => set(() => ({
		isServing: false,
		servePending: false,
	})),

	cancelServe: () => set(() => ({
		servePending: true,
	})),

	pushConsoleLine: (line) => set((state) => ({
		consoleOutput: [
			...state.consoleOutput.slice(0, 249),
			line,
		]
	})),

	clearConsole: () => set(() => ({
		consoleOutput: [],
	})),

	setDatabaseSchema: (databaseSchema) => set(() => ({
		databaseSchema
	})),

	setCurrentState: (currentState) => set(() => ({
		currentState
	})),

	setLatestError: (latestError) => set(() => ({
		latestError
	})),

	setVersion: (version) => set(() => ({
		version
	})),

	setQueryResponse: (tab, response) => set((state) => ({
		responses: {
			...state.responses,
			[tab]: response
		}
	})),

	clearQueryResponse: (tab) => set((state) => ({
		responses: {
			...state.responses,
			[tab]: []
		}
	})),

}));
