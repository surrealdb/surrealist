import { DatabaseSchema } from "~/types";
import { printLog } from "~/util/helpers";
import { create } from 'zustand';

export type DatabaseStore = {
	isServing: boolean;
	servePending: boolean;
	isConnecting: boolean;
	isConnected: boolean;
	isQueryActive: boolean;
	consoleOutput: string[];
	databaseSchema: DatabaseSchema | null;
	version: string;

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
};

export const useDatabaseStore = create<DatabaseStore>((set) => ({
	isServing: false,
	servePending: false,
	isConnecting: false,
	isConnected: false,
	isQueryActive: false,
	consoleOutput: [],
	databaseSchema: null,
	version: "",

	setQueryActive: (isQueryActive) => set(() => ({
		isQueryActive
	})),

	clearSchema: () => set(() => ({
		databaseSchema: null,
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

	setDatabaseSchema: (databaseSchema) => set(() => {
		printLog("Received database schema", "#e600a4", databaseSchema);
		return { databaseSchema };
	}),

	setIsConnecting: (isConnecting) => set(() => ({
		isConnecting,
	})),

	setIsConnected: (isConnected) => set((state) => ({
		isConnected,
		databaseSchema: isConnected ? state.databaseSchema : null,
	})),

	setVersion: (version) => set(() => ({
		version
	})),
}));
