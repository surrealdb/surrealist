import { Connection, DesignerLayoutMode, DesignerNodeMode, DriverType, HistoryQuery, PartialId, ResultMode, SavedQuery, SurrealistConfig, TabQuery, ViewMode } from "~/types";
import { createBaseConfig, createBaseTab } from "~/util/defaults";
import { MantineColorScheme } from "@mantine/core";
import { create } from "zustand";
import { MAX_HISTORY_SIZE, SANDBOX } from "~/constants";
import { clamp, newId } from "~/util/helpers";

type ConnectionUpdater = (value: Connection) => Partial<Connection>;

function updateConnection(state: ConfigStore, modifier: ConnectionUpdater) {
	if (state.activeConnection == SANDBOX) {
		return {
			sandbox: {
				...state.sandbox,
				...modifier(state.sandbox),
				id: SANDBOX,
			}
		};
	}

	const connections = state.connections.map((con) => {
		return con.id === state.activeConnection
			? { ...con, ...modifier(con), id: con.id }
			: con;
	});

	return { connections };
}

export type ConfigStore = SurrealistConfig & {
	setColorScheme: (theme: MantineColorScheme) => void;
	setAutoConnect: (autoConnect: boolean) => void;
	setTableSuggest: (tableSuggest: boolean) => void;
	setErrorChecking: (errorChecking: boolean) => void;
	setWordWrap: (wordWrap: boolean) => void;
	addConnection: (connection: Connection) => void;
	removeConnection: (connectionId: string) => void;
	updateConnection: (payload: PartialId<Connection>) => void;
	updateCurrentConnection: (payload: Partial<Connection>) => void;
	setConnections: (connections: Connection[]) => void;
	setActiveConnection: (connectionId: string) => void;
	setActiveView: (activeView: ViewMode) => void;
	addQueryTab: (query?: string, name?: string) => void;
	removeQueryTab: (tabId: string) => void;
	updateQueryTab: (payload: PartialId<TabQuery>) => void;
	setActiveQueryTab: (tabId: string) => void;
	setWindowPinned: (isPinned: boolean) => void;
	setWindowScale: (windowScale: number) => void;
	setEditorScale: (editorScale: number) => void;
	toggleWindowPinned: () => void;
	saveQuery: (query: SavedQuery) => void;
	removeSavedQuery: (savedId: string) => void;
	setSavedQueries: (queries: SavedQuery[]) => void;
	setLocalSurrealUser: (surrealUser: string) => void;
	setLocalSurrealPass: (surrealPass: string) => void;
	setLocalSurrealPort: (surrealPort: number) => void;
	setLocalSurrealDriver: (localDriver: DriverType) => void;
	setLocalSurrealStorage: (localStorage: string) => void;
	setLocalSurrealPath: (surrealPath: string) => void;
	setUpdateChecker: (updateChecker: boolean) => void;
	setLastPromptedVersion: (lastPromptedVersion: string) => void;
	setResultMode: (resultMode: ResultMode) => void;
	setDesignerLayoutMode: (defaultDesignerLayoutMode: DesignerLayoutMode) => void;
	setDesignerNodeMode: (defaultDesignerNodeMode: DesignerNodeMode) => void;
	addHistoryEntry: (entry: HistoryQuery) => void;
	toggleTablePin: (table: string) => void;
}

export const useConfigStore = create<ConfigStore>()(
	(set) => ({
		...createBaseConfig(),

		setColorScheme: (colorScheme) => set(() => ({ colorScheme })),

		setAutoConnect: (autoConnect) => set(() => ({ autoConnect })),

		setTableSuggest: (tableSuggest) => set(() => ({ tableSuggest })),

		setErrorChecking: (errorChecking) => set(() => ({ errorChecking })),

		setWordWrap: (wordWrap) => set(() => ({ wordWrap })),

		addConnection: (connection) => set((state) => ({
			connections: [
				...state.connections,
				connection
			]
		})),

		removeConnection: (connectionId) => set((state) => {
			const index = state.connections.findIndex((connection) => connection.id === connectionId);
			return {
				connections: index >= 0 ? state.connections.splice(index, 1) : state.connections,
				activeConnection: state.activeConnection == connectionId ? null : state.activeConnection,
			};
		}),

		updateConnection: (payload) => set((state) => ({
			connections: state.connections.map((connection) =>
				connection.id === payload.id
					? { ...connection, ...payload, }
					: connection
			)
		})),

		updateCurrentConnection: (payload) => set((state) => updateConnection(state, () => payload)),

		setConnections: (connections) => set(() => ({ connections })),

		setActiveConnection: (activeConnection) => set(() => ({ activeConnection })),

		setActiveView: (activeView) => set(() => ({ activeView })),

		addQueryTab: (query, name) => set((state) => updateConnection(state, (connection) => {
			const tabId = newId();
			const baseName = name || "New query";
			
			let queryName = "";
			let counter = 0;
	
			do {
				queryName = `${baseName} ${counter ? counter + 1 : ""}`.trim();
				counter++;
			} while (connection.queries.some((query) => query.name === queryName));

			return {
				queries: [...connection.queries, {
					...createBaseTab(query),
					name: queryName,
					id: tabId,
				}],
				activeQuery: tabId,
			};
		})),

		removeQueryTab: (queryId) => set((state) => updateConnection(state, (connection) => {
			const index = connection.queries.findIndex((query) => query.id === queryId);
			
			if (index < 0) {
				return {};
			}

			let activeQuery = connection.activeQuery;

			if (connection.activeQuery === queryId) {
				activeQuery = index === connection.queries.length - 1
					? connection.queries[index - 1]?.id
					: connection.queries[index + 1]?.id;
			}

			return {
				queries: connection.queries.toSpliced(index, 1),
				activeQuery
			};
		})),

		updateQueryTab: (payload) => set((state) => updateConnection(state, (connection) => {
			const index = connection.queries.findIndex((query) => query.id === connection.activeQuery);

			if (index < 0) {
				return {};
			}

			return {
				queries: connection.queries.with(index, {
					...connection.queries[index],
					...payload,
				})
			};
		})),

		setActiveQueryTab: (connectionId) => set((state) => updateConnection(state, () => ({
			activeQuery: connectionId,
		}))),

		setWindowPinned: (isPinned) => set(() => ({ isPinned })),

		setWindowScale: (windowScale) => set(() => ({
			windowScale: clamp(windowScale, 50, 150),
		})),

		setEditorScale: (editorScale) => set(() => ({
			editorScale: clamp(editorScale, 50, 150),
		})),

		toggleWindowPinned: () => set((state) => ({
			isPinned: !state.isPinned,
		})),

		saveQuery: (query) => set((state) => {
			const savedQueries = [...state.savedQueries];
			const index = savedQueries.findIndex((entry) => entry.id === query.id);

			if (index < 0) {
				savedQueries.push(query);
			} else {
				savedQueries[index] = query;
			}

			return {
				savedQueries
			};
		}),

		removeSavedQuery: (savedId) => set((state) => ({
			savedQueries: state.savedQueries.filter((entry) => entry.id !== savedId),
		})),

		setSavedQueries: (savedQueries) => set(() => ({
			savedQueries,
		})),

		setLocalSurrealUser: (localSurrealUser) => set(() => ({ localSurrealUser })),

		setLocalSurrealPass: (localSurrealPass) => set(() => ({ localSurrealPass })),

		setLocalSurrealPort: (localSurrealPort) => set(() => ({ localSurrealPort })),

		setLocalSurrealDriver: (localSurrealDriver) => set(() => ({ localSurrealDriver })),

		setLocalSurrealStorage: (localSurrealStorage) => set(() => ({ localSurrealStorage })),

		setLocalSurrealPath: (localSurrealPath) => set(() => ({ localSurrealPath })),

		setUpdateChecker: (updateChecker) => set(() => ({ updateChecker })),

		setLastPromptedVersion: (lastPromptedVersion) => set(() => ({ lastPromptedVersion })),

		setResultMode: (resultMode) => set(() => ({ resultMode })),

		setDesignerLayoutMode: (defaultDesignerLayoutMode) => set(() => ({ defaultDesignerLayoutMode })),

		setDesignerNodeMode: (defaultDesignerNodeMode) => set(() => ({ defaultDesignerNodeMode })),

		addHistoryEntry: (entry) => set((state) => updateConnection(state, (connection) => {
			const queryHistory = [...connection.queryHistory];

			queryHistory.push(entry);

			if (queryHistory.length > MAX_HISTORY_SIZE) {
				queryHistory.shift();
			}

			return {
				queryHistory
			};
		})),

		toggleTablePin: (table) => set((state) => updateConnection(state, (connection) => {
			const pinnedTables = [...connection.pinnedTables];
			const index = pinnedTables.indexOf(table);

			if (index < 0) {
				pinnedTables.push(table);
			} else {
				pinnedTables.splice(index, 1);
			}

			return {
				pinnedTables
			};
		})),

	})
);