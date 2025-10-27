import { omit } from "radash";
import { Diagnostic } from "surrealdb";
import { create } from "zustand";
import type { GraphqlResponse } from "~/screens/surrealist/connection/connection";
import type { ConnectionSchema, QueryResponse } from "~/types";
import { createConnectionSchema } from "~/util/defaults";

export type State = "disconnected" | "connecting" | "retrying" | "connected";
export type DiagnosticWithTime = Diagnostic & { timestamp: number };

export type DatabaseStore = {
	isServing: boolean;
	servePending: boolean;
	currentState: State;
	latestError: string;
	isQueryActive: boolean;
	isGraphqlQueryActive: boolean;
	consoleOutput: string[];
	connectionSchema: ConnectionSchema;
	version: string;
	queryResponses: Record<string, QueryResponse[]>;
	graphqlResponse: Record<string, GraphqlResponse>;
	diagnostics: DiagnosticWithTime[];

	setQueryActive: (isQueryActive: boolean) => void;
	setGraphqlQueryActive: (isQueryActive: boolean) => void;
	clearSchema: () => void;
	prepareServe: () => void;
	confirmServing: () => void;
	stopServing: () => void;
	cancelServe: () => void;
	pushConsoleLine: (line: string, max: number) => void;
	clearConsole: () => void;
	setDatabaseSchema: (databaseSchema: ConnectionSchema) => void;
	setCurrentState: (currentState: State) => void;
	setLatestError: (latestError: string) => void;
	setVersion: (version: string) => void;
	setQueryResponse: (tab: string, response: QueryResponse[]) => void;
	clearQueryResponse: (tab: string) => void;
	setGraphqlResponse: (connection: string, response: GraphqlResponse) => void;
	clearGraphqlResponse: (connection: string) => void;
	pushDiagnostic: (diagnostic: Diagnostic, max: number) => void;
};

export const useDatabaseStore = create<DatabaseStore>((set) => ({
	isServing: false,
	servePending: false,
	currentState: "disconnected",
	latestError: "",
	isQueryActive: false,
	isGraphqlQueryActive: false,
	consoleOutput: [],
	connectionSchema: createConnectionSchema(),
	version: "",
	queryResponses: {},
	graphqlResponse: {},
	diagnostics: [],

	setQueryActive: (isQueryActive) =>
		set(() => ({
			isQueryActive,
		})),

	setGraphqlQueryActive: (isGraphqlQueryActive) =>
		set(() => ({
			isGraphqlQueryActive,
		})),

	clearSchema: () =>
		set(() => ({
			connectionSchema: createConnectionSchema(),
		})),

	prepareServe: () =>
		set(() => ({
			servePending: true,
			consoleOutput: [],
		})),

	confirmServing: () =>
		set(() => ({
			isServing: true,
			servePending: false,
		})),

	stopServing: () =>
		set(() => ({
			isServing: false,
			servePending: false,
		})),

	cancelServe: () =>
		set(() => ({
			servePending: true,
		})),

	pushConsoleLine: (line, max) =>
		set((state) => ({
			consoleOutput: [...state.consoleOutput, line].slice(-max),
		})),

	clearConsole: () =>
		set(() => ({
			consoleOutput: [],
		})),

	setDatabaseSchema: (databaseSchema) =>
		set(() => ({
			connectionSchema: databaseSchema,
		})),

	setCurrentState: (currentState) =>
		set(() => ({
			currentState,
		})),

	setLatestError: (latestError) =>
		set(() => ({
			latestError,
		})),

	setVersion: (version) =>
		set(() => ({
			version,
		})),

	setQueryResponse: (tab, response) =>
		set((state) => ({
			queryResponses: {
				...state.queryResponses,
				[tab]: response,
			},
		})),

	clearQueryResponse: (tab) =>
		set((state) => ({
			queryResponses: omit(state.queryResponses, [tab]),
		})),

	setGraphqlResponse: (connection, response) =>
		set((state) => ({
			graphqlResponse: {
				...state.graphqlResponse,
				[connection]: response,
			},
		})),

	clearGraphqlResponse: (connection) =>
		set((state) => ({
			graphqlResponse: omit(state.graphqlResponse, [connection]),
		})),

	pushDiagnostic: (diagnostic, max) =>
		set((state) => ({
			diagnostics: [...state.diagnostics, { ...diagnostic, timestamp: Date.now() }].slice(
				-max,
			),
		})),
}));
