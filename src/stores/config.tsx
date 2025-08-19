import type { FeatureFlag, FeatureFlagOption } from "@theopensource-company/feature-flags";
import { unique } from "radash";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { MAX_HISTORY_SIZE, SANDBOX } from "~/constants";
import type {
	Connection,
	Folder,
	HistoryQuery,
	PartialId,
	QueryTab,
	QueryType,
	SavedQuery,
	SurrealistAppearanceSettings,
	SurrealistBehaviorSettings,
	SurrealistCloudSettings,
	SurrealistConfig,
	SurrealistGtmSettings,
	SurrealistServingSettings,
	SurrealistTemplateSettings,
} from "~/types";
import { createBaseConfig, createBaseQuery } from "~/util/defaults";
import type { schema } from "~/util/feature-flags";
import { newId, uniqueName } from "~/util/helpers";

type ConnectionUpdater = (value: Connection) => Partial<Connection>;

interface NewQueryTab {
	type: QueryType;
	query?: string;
	name?: string;
	variables?: string;
}

function modifyConnection(state: ConfigStore, connection: string, modifier: ConnectionUpdater) {
	if (connection === SANDBOX) {
		return {
			sandbox: {
				...state.sandbox,
				...modifier(state.sandbox),
				id: SANDBOX,
			},
		};
	}

	return {
		connections: state.connections.map((con) => {
			return con.id === connection ? { ...con, ...modifier(con), id: con.id } : con;
		}),
	};
}

export type ConfigStore = SurrealistConfig & {
	applyPreference: <T>(updater: (state: ConfigStore, value: T) => void, value: T) => void;
	addConnection: (connection: Connection) => void;
	removeConnection: (connectionId: string) => void;
	updateConnection: (connection: PartialId<Connection>) => void;
	setConnections: (connections: Connection[]) => void;
	setActiveResource: (resource: string) => void;
	addQueryTab: (connectionId: string, options: NewQueryTab) => void;
	removeQueryTab: (connectionId: string, tabId: string) => void;
	updateQueryTab: (connectionId: string, connection: PartialId<QueryTab>) => void;
	setActiveQueryTab: (connectionId: string, tabId: string) => void;
	addQueryFolder: (connectionId: string, name: string, parentId?: string) => void;
	removeQueryFolder: (connectionId: string, folderId: string) => void;
	updateQueryFolder: (connectionId: string, folder: PartialId<Folder>) => void;
	navigateToFolder: (connectionId: string, folderId: string) => void;
	navigateToParentFolder: (connectionId: string) => void;
	navigateToRoot: (connectionId: string) => void;
	saveQuery: (query: SavedQuery) => void;
	removeSavedQuery: (savedId: string) => void;
	setSavedQueries: (queries: SavedQuery[]) => void;
	setLastPromptedVersion: (lastPromptedVersion: string) => void;
	addHistoryEntry: (connectionId: string, entry: HistoryQuery) => void;
	toggleTablePin: (connectionId: string, table: string) => void;
	updateBehaviorSettings: (settings: Partial<SurrealistBehaviorSettings>) => void;
	updateAppearanceSettings: (settings: Partial<SurrealistAppearanceSettings>) => void;
	updateTemplateSettings: (settings: Partial<SurrealistTemplateSettings>) => void;
	updateServingSettings: (settings: Partial<SurrealistServingSettings>) => void;
	updateCloudSettings: (settings: Partial<SurrealistCloudSettings>) => void;
	updateGtmSettings: (settings: Partial<SurrealistGtmSettings>) => void;
	setFeatureFlag: <T extends FeatureFlag<typeof schema>>(
		key: T,
		value: FeatureFlagOption<typeof schema, T>,
	) => void;
	setPreviousVersion: (previousVersion: string) => void;
	pushCommand: (command: string) => void;
	updateViewedNews: () => void;
	completeOnboarding: (key: string) => void;
	resetOnboardings: () => void;
	setOpenDesignerPanels: (openDesignerPanels: string[]) => void;
	setKeybinding: (command: string, action: string[]) => void;
	removeKeybinding: (command: string) => void;
};

export const useConfigStore = create<ConfigStore>()(
	immer((set) => ({
		...createBaseConfig(),

		applyPreference: (updater, value) =>
			set((state) => {
				updater(state, value);
				return state;
			}),

		addConnection: (connection) =>
			set((state) => ({
				connections: [...state.connections, connection],
			})),

		removeConnection: (connectionId) =>
			set((state) => {
				return {
					connections: state.connections.filter(
						(connection) => connection.id !== connectionId,
					),
				};
			}),

		updateConnection: (connection) =>
			set((state) => modifyConnection(state, connection.id, () => connection)),

		setConnections: (connections) => set(() => ({ connections })),

		setActiveResource: (activeResource) => set(() => ({ activeResource })),

		addQueryTab: (connectionId, options) =>
			set((state) =>
				modifyConnection(state, connectionId, (current) => {
					const tabId = newId();
					const existing = current.queries.map((query) => query.name ?? "");
					const queryName = uniqueName(options?.name || "New query", existing);

					// Set the folder ID to the current folder (last in path) or undefined for root
					const currentFolderId =
						current.queryFolderPath.length > 0
							? current.queryFolderPath[current.queryFolderPath.length - 1]
							: undefined;

					// Calculate the next order number for items in this folder
					const itemsInFolder = [
						...current.queries.filter((q) => q.folderId === currentFolderId),
						...current.queryFolders.filter((f) => f.parentId === currentFolderId),
					];
					const maxOrder = itemsInFolder.reduce(
						(max, item) => Math.max(max, item.order),
						-1,
					);

					return {
						queries: [
							...current.queries,
							{
								...createBaseQuery(state.settings, options?.type),
								query: options?.query || "",
								variables: options?.variables || "{}",
								name: queryName,
								id: tabId,
								folderId: currentFolderId,
								order: maxOrder + 1,
							},
						],
						activeQuery: tabId,
					};
				}),
			),

		removeQueryTab: (connectionId, queryId) =>
			set((state) =>
				modifyConnection(state, connectionId, (current) => {
					const index = current.queries.findIndex((query) => query.id === queryId);

					if (index < 0) {
						return {};
					}

					let activeQuery = current.activeQuery;

					if (current.activeQuery === queryId) {
						activeQuery =
							index === current.queries.length - 1
								? current.queries[index - 1]?.id
								: current.queries[index + 1]?.id;
					}

					return {
						queries: current.queries.toSpliced(index, 1),
						activeQuery,
					};
				}),
			),

		updateQueryTab: (connectionId, connection) =>
			set((state) =>
				modifyConnection(state, connectionId, (current) => {
					const index = current.queries.findIndex((query) => query.id === connection.id);

					if (index < 0) {
						return {};
					}

					return {
						queries: current.queries.with(index, {
							...current.queries[index],
							...connection,
						}),
					};
				}),
			),

		setActiveQueryTab: (connectionId, tabId) =>
			set((state) =>
				modifyConnection(state, connectionId, () => ({
					activeQuery: tabId,
				})),
			),

		addQueryFolder: (connectionId, name, parentId) =>
			set((state) =>
				modifyConnection(state, connectionId, (current) => {
					const folderId = newId();
					const maxOrder = current.queryFolders.reduce(
						(max, folder) => Math.max(max, folder.order),
						-1,
					);

					// If no parentId provided, use the current folder (last in path) or undefined for root
					const folderParentId =
						parentId !== undefined
							? parentId
							: current.queryFolderPath.length > 0
								? current.queryFolderPath[current.queryFolderPath.length - 1]
								: undefined;

					const newFolder: Folder = {
						id: folderId,
						name,
						parentId: folderParentId,
						order: maxOrder + 1,
					};

					return {
						queryFolders: [...current.queryFolders, newFolder],
					};
				}),
			),

		removeQueryFolder: (connectionId, folderId) =>
			set((state) =>
				modifyConnection(state, connectionId, (current) => {
					// Remove all child folders recursively
					const removeChildFolders = (folders: Folder[], parentId: string): Folder[] => {
						const childFolders = folders.filter((f) => f.parentId === parentId);
						let filteredFolders = folders.filter((f) => f.parentId !== parentId);

						for (const child of childFolders) {
							filteredFolders = removeChildFolders(filteredFolders, child.id);
						}

						return filteredFolders;
					};

					const filteredFolders = removeChildFolders(current.queryFolders, folderId);
					const finalFolders = filteredFolders.filter((folder) => folder.id !== folderId);

					// Move queries out of deleted folders
					const updatedQueries = current.queries.map((query) => {
						if (
							query.folderId === folderId ||
							!finalFolders.some((f) => f.id === query.folderId)
						) {
							return { ...query, folderId: undefined };
						}
						return query;
					});

					return {
						queryFolders: finalFolders,
						queries: updatedQueries,
					};
				}),
			),

		updateQueryFolder: (connectionId, folder) =>
			set((state) =>
				modifyConnection(state, connectionId, (current) => {
					const index = current.queryFolders.findIndex((f) => f.id === folder.id);

					if (index < 0) {
						return {};
					}

					return {
						queryFolders: current.queryFolders.with(index, {
							...current.queryFolders[index],
							...folder,
						}),
					};
				}),
			),

		navigateToFolder: (connectionId, folderId) =>
			set((state) =>
				modifyConnection(state, connectionId, (current) => {
					// Verify the folder exists
					const folder = current.queryFolders.find((f) => f.id === folderId);
					if (!folder) return {};

					// Build the new path by adding the folder ID
					const newPath = [...current.queryFolderPath, folderId];

					return {
						queryFolderPath: newPath,
					};
				}),
			),

		navigateToParentFolder: (connectionId) =>
			set((state) =>
				modifyConnection(state, connectionId, (current) => {
					if (current.queryFolderPath.length === 0) return {};

					// Remove the last folder ID from the path
					const newPath = current.queryFolderPath.slice(0, -1);

					return {
						queryFolderPath: newPath,
					};
				}),
			),

		navigateToRoot: (connectionId) =>
			set((state) =>
				modifyConnection(state, connectionId, () => ({
					queryFolderPath: [],
				})),
			),

		saveQuery: (query) =>
			set((state) => {
				const savedQueries = [...state.savedQueries];
				const index = savedQueries.findIndex((entry) => entry.id === query.id);

				if (index < 0) {
					savedQueries.push(query);
				} else {
					savedQueries[index] = query;
				}

				return {
					savedQueries,
				};
			}),

		removeSavedQuery: (savedId) =>
			set((state) => ({
				savedQueries: state.savedQueries.filter((entry) => entry.id !== savedId),
			})),

		setSavedQueries: (savedQueries) =>
			set(() => ({
				savedQueries,
			})),

		setLastPromptedVersion: (lastPromptedVersion) => set(() => ({ lastPromptedVersion })),

		addHistoryEntry: (connectionId, entry) =>
			set((state) =>
				modifyConnection(state, connectionId, (current) => {
					const queryHistory = [...current.queryHistory];

					queryHistory.push(entry);

					if (queryHistory.length > MAX_HISTORY_SIZE) {
						queryHistory.shift();
					}

					return {
						queryHistory,
					};
				}),
			),

		toggleTablePin: (connectionId, table) =>
			set((state) =>
				modifyConnection(state, connectionId, (current) => {
					const pinnedTables = [...current.pinnedTables];
					const index = pinnedTables.indexOf(table);

					if (index < 0) {
						pinnedTables.push(table);
					} else {
						pinnedTables.splice(index, 1);
					}

					return {
						pinnedTables,
					};
				}),
			),

		setFeatureFlag: (key, value) =>
			set(({ featureFlags }) => ({
				featureFlags: {
					...featureFlags,
					[key]: value,
				},
			})),

		updateBehaviorSettings: (settings) =>
			set((state) => ({
				settings: {
					...state.settings,
					behavior: {
						...state.settings.behavior,
						...settings,
					},
				},
			})),

		updateAppearanceSettings: (settings) =>
			set((state) => ({
				settings: {
					...state.settings,
					appearance: {
						...state.settings.appearance,
						...settings,
					},
				},
			})),

		updateTemplateSettings: (settings) =>
			set((state) => ({
				settings: {
					...state.settings,
					templates: {
						...state.settings.templates,
						...settings,
					},
				},
			})),

		updateServingSettings: (settings) =>
			set((state) => ({
				settings: {
					...state.settings,
					serving: {
						...state.settings.serving,
						...settings,
					},
				},
			})),

		updateCloudSettings: (settings) =>
			set((state) => ({
				settings: {
					...state.settings,
					cloud: {
						...state.settings.cloud,
						...settings,
					},
				},
			})),

		updateGtmSettings: (settings) =>
			set((state) => ({
				settings: {
					...state.settings,
					gtm: {
						...state.settings.gtm,
						...settings,
					},
				},
			})),

		pushCommand: (command) =>
			set((state) => {
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
					commandHistory,
				};
			}),

		setPreviousVersion: (previousVersion) =>
			set(() => ({
				previousVersion,
			})),

		updateViewedNews: () =>
			set(() => ({
				lastViewedNewsAt: Date.now(),
			})),

		completeOnboarding: (key) =>
			set((state) => ({
				onboarding: unique([...state.onboarding, key]),
			})),

		resetOnboardings: () =>
			set(() => ({
				onboarding: [],
			})),

		setOpenDesignerPanels: (openDesignerPanels) =>
			set(() => ({
				openDesignerPanels,
			})),

		setKeybinding: (command, action) =>
			set((state) => {
				return { keybindings: { ...state.keybindings, [command]: action } };
			}),

		removeKeybinding: (command) =>
			set((state) => {
				const keybindings = { ...state.keybindings };
				delete keybindings[command];
				return { keybindings };
			}),
	})),
);
