import { Connection, HistoryQuery, PartialId, QueryType, SavedQuery, SurrealistAppearanceSettings, SurrealistBehaviorSettings, SurrealistConfig, SurrealistServingSettings, SurrealistTemplateSettings, TabQuery, ViewMode } from "~/types";
import { createBaseConfig, createBaseTab } from "~/util/defaults";
import { extract_query_type } from "~/generated/surrealist-embed";
import { MAX_HISTORY_SIZE, SANDBOX } from "~/constants";
import { newId } from "~/util/helpers";
import { create } from "zustand";
import { FeatureFlag, FeatureFlagOption } from "@theopensource-company/feature-flags";
import { featureFlagSchema } from "~/util/feature-flags";

type ConnectionUpdater = (value: Connection) => Partial<Connection>;

interface NewQueryTab {
	query?: string;
	name?: string;
	variables?: string;
}

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
	addConnection: (connection: Connection) => void;
	removeConnection: (connectionId: string) => void;
	updateConnection: (payload: PartialId<Connection>) => void;
	updateCurrentConnection: (payload: Partial<Connection>) => void;
	setConnections: (connections: Connection[]) => void;
	setActiveConnection: (connectionId: string) => void;
	setActiveView: (activeView: ViewMode) => void;
	addQueryTab: (options?: NewQueryTab) => void;
	removeQueryTab: (tabId: string) => void;
	updateQueryTab: (payload: PartialId<TabQuery>) => void;
	setActiveQueryTab: (tabId: string) => void;
	saveQuery: (query: SavedQuery) => void;
	removeSavedQuery: (savedId: string) => void;
	setSavedQueries: (queries: SavedQuery[]) => void;
	setLastPromptedVersion: (lastPromptedVersion: string) => void;
	addHistoryEntry: (entry: HistoryQuery) => void;
	toggleTablePin: (table: string) => void;
	updateBehaviorSettings: (settings: Partial<SurrealistBehaviorSettings>) => void;
	updateAppearanceSettings: (settings: Partial<SurrealistAppearanceSettings>) => void;
	updateTemplateSettings: (settings: Partial<SurrealistTemplateSettings>) => void;
	updateServingSettings: (settings: Partial<SurrealistServingSettings>) => void;
	setFeatureFlag: <T extends FeatureFlag<typeof featureFlagSchema>>(key: T, value: FeatureFlagOption<typeof featureFlagSchema, T>) => void;
	pushCommand: (command: string) => void;
	softReset: () => void;
}

export const useConfigStore = create<ConfigStore>()(
	(set) => ({
		...createBaseConfig(),

		addConnection: (connection) => set((state) => ({
			connections: [
				...state.connections,
				connection
			]
		})),

		removeConnection: (connectionId) => set((state) => {
			return {
				connections: state.connections.filter((connection) => connection.id !== connectionId),
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

		addQueryTab: (options) => set((state) => updateConnection(state, (connection) => {
			const tabId = newId();
			const baseName = options?.name || "New query";

			let queryName = "";
			let counter = 0;

			do {
				queryName = `${baseName} ${counter ? counter + 1 : ""}`.trim();
				counter++;
			} while (connection.queries.some((query) => query.name === queryName));

			return {
				queries: [...connection.queries, {
					...createBaseTab(state.settings, options?.query),
					variables: options?.variables || "{}",
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

			const query = {
				...connection.queries[index],
				...payload,
			};

			if (payload.query !== undefined) {
				query.queryType = extract_query_type(payload.query) as QueryType;
			}

			return {
				queries: connection.queries.with(index, query)
			};
		})),

		setActiveQueryTab: (connectionId) => set((state) => updateConnection(state, () => ({
			activeQuery: connectionId,
		}))),

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

		setLastPromptedVersion: (lastPromptedVersion) => set(() => ({ lastPromptedVersion })),

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

		setFeatureFlag: (key, value) => set(({ featureFlags }) => ({
			featureFlags: {
				...featureFlags,
				[key]: value,
			}
		})),

		softReset: () => set(() => ({
			activeConnection: null,
			activeView: "query"
		})),

		updateBehaviorSettings: (settings) => set((state) => ({
			settings: {
				...state.settings,
				behavior: {
					...state.settings.behavior,
					...settings,
				}
			}
		})),

		updateAppearanceSettings: (settings) => set((state) => ({
			settings: {
				...state.settings,
				appearance: {
					...state.settings.appearance,
					...settings,
				}
			}
		})),

		updateTemplateSettings: (settings) => set((state) => ({
			settings: {
				...state.settings,
				templates: {
					...state.settings.templates,
					...settings,
				}
			}
		})),

		updateServingSettings: (settings) => set((state) => ({
			settings: {
				...state.settings,
				serving: {
					...state.settings.serving,
					...settings,
				}
			}
		})),

		pushCommand: (command) => set((state) => {
			const commandHistory = [...state.commandHistory];
			const index = commandHistory.indexOf(command);

			if (index >= 0) {
				commandHistory.splice(index, 1);
			}

			commandHistory.unshift(command);

			if (commandHistory.length > 3) {
				commandHistory.pop();
			}

			return {
				commandHistory
			};
		})

	})
);