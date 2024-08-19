import { DatabaseSchema, QueryResponse } from "~/types";
import { create } from 'zustand';
import { createDatabaseSchema } from "~/util/defaults";
import { omit } from "radash";
import { GraphqlResponse } from "~/screens/database/connection/connection";

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
	queryResponses: Record<string, QueryResponse[]>;
	graphqlResponse: Record<string, GraphqlResponse>;

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
	setGraphqlResponse: (connection: string, response: GraphqlResponse) => void;
	clearGraphqlResponse: (connection: string) => void;
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
	queryResponses: {},
	graphqlResponse: {},

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
		queryResponses: {
			...state.queryResponses,
			[tab]: response
		}
	})),

	clearQueryResponse: (tab) => set((state) => ({
		queryResponses: omit(state.queryResponses, [tab])
	})),

	setGraphqlResponse: (connection, response) => set((state) => ({
		graphqlResponse: {
			...state.graphqlResponse,
			[connection]: response
		}
	})),

	clearGraphqlResponse: (connection) => set((state) => ({
		graphqlResponse: omit(state.graphqlResponse, [connection])
	})),

}));
