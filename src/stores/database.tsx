import { DatabaseSchema, QueryResponse } from "~/types";
import { create } from 'zustand';
import { createDatabaseSchema } from "~/util/defaults";

export type DatabaseStore = {
	isServing: boolean;
	servePending: boolean;
	isConnecting: boolean;
	isConnected: boolean;
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
	setIsConnecting: (isConnecting: boolean) => void;
	setIsConnected: (isConnected: boolean) => void;
	setVersion: (version: string) => void;
	setQueryResponse: (tab: string, response: QueryResponse[]) => void;
	clearQueryResponse: (tab: string) => void;
};

export const useDatabaseStore = create<DatabaseStore>((set) => ({
	isServing: false,
	servePending: false,
	isConnecting: false,
	isConnected: false,
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

	setIsConnecting: (isConnecting) => set(() => ({
		isConnecting,
	})),

	setIsConnected: (isConnected) => set((state) => ({
		isConnected,
		databaseSchema: isConnected ? state.databaseSchema : createDatabaseSchema(),
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
