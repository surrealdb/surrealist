import { Connection, DesignerLayoutMode, DesignerNodeMode, DriverType, HistoryQuery, PartialId, ResultMode, SavedQuery, SurrealistConfig, TabQuery, ViewMode } from "~/types";
import { createBaseConfig, createBaseTab } from "~/util/defaults";
import { MantineColorScheme } from "@mantine/core";
import { create } from "zustand";
import { MAX_HISTORY_SIZE, SANDBOX } from "~/constants";
import { newId } from "~/util/helpers";

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
	addQueryTab: (query?: string) => void;
	removeQueryTab: (tabId: string) => void;
	updateQueryTab: (payload: PartialId<TabQuery>) => void;
	setActiveQueryTab: (tabId: string) => void;
	setWindowPinned: (isPinned: boolean) => void;
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
	increaseFontZoomLevel: () => void;
	decreaseFontZoomLevel: () => void;
	resetFontZoomLevel: () => void;
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

		addQueryTab: (query) => set((state) => updateConnection(state, (connection) => {
			const tabId = newId();

			let queryName = "";
			let counter = 0;
	
			do {
				queryName = `New query ${counter ? counter + 1 : ""}`.trim();
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

		toggleWindowPinned: () => set((state) => ({
			isPinned: !state.isPinned,
		})),

		saveQuery: (query) => set((state) => {
			const savedQueries = state.savedQueries;
			const index = savedQueries.findIndex((entry) => entry.id === query.id);

			if (index < 0) {
				state.savedQueries.push(query);
			} else {
				state.savedQueries[index] = query;
			}

			return { savedQueries };
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

		increaseFontZoomLevel: () => set((state) => ({
			fontZoomLevel: Math.min(state.fontZoomLevel + 0.1, 2),
		})),

		decreaseFontZoomLevel: () => set((state) => ({
			fontZoomLevel: Math.max(state.fontZoomLevel - 0.1, 0.5),
		})),

		resetFontZoomLevel: () => set(() => ({
			fontZoomLevel: 1,
		})),

		setDesignerLayoutMode: (defaultDesignerLayoutMode) => set(() => ({ defaultDesignerLayoutMode })),

		setDesignerNodeMode: (defaultDesignerNodeMode) => set(() => ({ defaultDesignerNodeMode })),

		addHistoryEntry: (entry) => set((state) => updateConnection(state, (connection) => {
			connection.queryHistory.push(entry);

			if (connection.queryHistory.length > MAX_HISTORY_SIZE) {
				connection.queryHistory.shift();
			}

			return connection;
		})),

		toggleTablePin: (table) => set((state) => updateConnection(state, (connection) => {
			const index = connection.pinnedTables.indexOf(table);

			if (index < 0) {
				connection.pinnedTables.push(table);
			} else {
				connection.pinnedTables.splice(index, 1);
			}

			return connection;
		})),

	})
);