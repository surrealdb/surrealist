import {
	iconAPI,
	iconAccountPlus,
	iconAccountSecure,
	iconAuth,
	iconAutoFix,
	iconBalance,
	iconBook,
	iconBraces,
	iconChevronRight,
	iconClose,
	iconCog,
	iconCommand,
	iconConsole,
	iconDownload,
	iconFlag,
	iconFolderSecure,
	iconHelp,
	iconHistory,
	iconMagnifyMinus,
	iconMagnifyPlus,
	iconNewspaper,
	iconPin,
	iconPlay,
	iconPlus,
	iconRefresh,
	iconReset,
	iconRoutes,
	iconSandbox,
	iconSearch,
	iconServer,
	iconServerSecure,
	iconStar,
	iconStarPlus,
	iconStop,
	iconText,
	iconTextBoxMinus,
	iconTextBoxPlus,
	iconTransfer,
	iconTune,
	iconUpload,
	iconWrench,
} from "./icons";

import { adapter, isDesktop } from "~/adapter";
import type { DesktopAdapter } from "~/adapter/desktop";
import { CODE_LANGUAGES, SANDBOX, VIEW_MODES } from "~/constants";
import { closeConnection, openConnection } from "~/screens/database/connection/connection";
import { useConfigStore } from "~/stores/config";
import { useDatabaseStore } from "~/stores/database";
import { getConnection } from "./connection";
import { featureFlags } from "./feature-flags";
import { newId } from "./helpers";
import type { IntentPayload, IntentType } from "./intents";
import { type PreferenceController, computePreferences } from "./preferences";
import { syncConnectionSchema } from "./schema";

type LaunchAction = { type: "launch"; handler: () => void };
type InsertAction = { type: "insert"; content: string };
type HrefAction = { type: "href"; href: string };
type PreferenceAction = { type: "preference"; controller: PreferenceController };
type IntentAction = {
	type: "intent";
	intent: IntentType;
	payload?: IntentPayload;
};

type Action = LaunchAction | InsertAction | HrefAction | IntentAction | PreferenceAction;
type CategoryVisibility = "always" | "searched" | "unsearched";

export interface Command {
	id: string;
	name: string;
	icon: string;
	shortcut?: string | string[];
	action: Action;
	aliases?: string[];
	disabled?: boolean;
}

export interface CommandCategory {
	name: string;
	visibility?: CategoryVisibility;
	commands: Command[];
}

/** Create a launch command */
const launch = (handler: () => void) => ({ type: "launch", handler }) as const;

/** Create an insertion command */
const insert = (content: string) => ({ type: "insert", content }) as const;

/** Create an href command */
const href = (href: string) => ({ type: "href", href }) as const;

/** Create a new preference command */
const preference = (controller: PreferenceController) =>
	({ type: "preference", controller }) as const;

/** Create an intent command */
const intent = (intent: IntentType, payload?: IntentPayload) =>
	({ type: "intent", intent, payload }) as const;

/**
 * Compute available commands based on the current state
 */
export function computeCommands(): CommandCategory[] {
	const {
		activeView,
		connections,
		commandHistory,
		setActiveView,
		setActiveConnection,
		setActiveScreen,
		resetOnboardings,
	} = useConfigStore.getState();

	const { isServing, currentState, connectionSchema } = useDatabaseStore.getState();

	const activeCon = getConnection();
	const isSandbox = activeCon?.id === SANDBOX;
	const canDisconnect = currentState !== "disconnected" && !isSandbox;
	const preferences = computePreferences().flatMap(({ name, preferences }) =>
		preferences.map((pref) => ({ ...pref, name: `${name} > ${pref.name}` })),
	);

	const categories: CommandCategory[] = [];

	categories.push(
		{
			name: "History",
			visibility: "unsearched",
			commands: commandHistory.map((entry) => ({
				id: newId(),
				name: entry,
				icon: iconSearch,
				action: insert(entry),
			})),
		},
		{
			name: "Connections",
			commands: [
				{
					id: newId(),
					name: `Open the Sandbox`,
					icon: iconSandbox,
					action: launch(() => {
						setActiveConnection(SANDBOX);
					}),
				},
				...connections.map((connection) => ({
					id: newId(),
					name: `Connect to ${connection.name}`,
					icon: iconServer,
					action: launch(() => {
						setActiveConnection(connection.id);
					}),
				})),
				{
					id: newId(),
					name: `Create new connection`,
					icon: iconPlus,
					action: intent("new-connection"),
				},
				{
					id: newId(),
					name: `Reconnect to database`,
					icon: iconRefresh,
					action: launch(openConnection),
				},
				...(canDisconnect
					? [
							{
								id: newId(),
								name: `Disconnect from database`,
								icon: iconClose,
								action: launch(closeConnection),
							},
						]
					: []),
			],
		},
	);

	if (activeCon) {
		const tables = connectionSchema.database.tables || [];
		const accessMethods = [
			...connectionSchema.root.accesses,
			...connectionSchema.namespace.accesses,
			...connectionSchema.database.accesses,
		].filter((access) => access.kind.kind === "RECORD");

		categories.push(
			{
				name: "Views",
				commands: Object.values(VIEW_MODES).flatMap((view) =>
					view.disabled?.(featureFlags.store)
						? []
						: [
								{
									id: newId(),
									name: `Open ${view.name} View`,
									icon: view.icon,
									action: launch(() => {
										setActiveView(view.id);
									}),
								},
							],
				),
			},
			{
				name: "Tables",
				commands: [
					...tables.map((table) => ({
						id: newId(),
						name: `Explore table ${table.schema.name}`,
						icon: iconChevronRight,
						action: intent("explore-table", {
							table: table.schema.name,
						}),
					})),
					...tables.map((table) => ({
						id: newId(),
						name: `Design table ${table.schema.name}`,
						icon: iconChevronRight,
						action: intent("design-table", {
							table: table.schema.name,
						}),
					})),
					{
						id: newId(),
						name: `Create new table`,
						icon: iconPlus,
						action: intent("new-table"),
					},
				],
			},
			{
				name: "Query",
				commands: [
					...(activeView === "query"
						? [
								{
									id: newId(),
									name: "Run query",
									icon: iconPlay,
									shortcut: ["F9", "mod enter"],
									action: intent("run-query"),
								},
								{
									id: newId(),
									name: "Save query",
									icon: iconStarPlus,
									action: intent("save-query"),
								},
								{
									id: newId(),
									name: "Format query",
									icon: iconText,
									action: intent("format-query"),
								},
								{
									id: newId(),
									name: "Toggle variables panel",
									icon: iconBraces,
									action: intent("toggle-variables"),
								},
								{
									id: newId(),
									name: "Infer variables from query",
									icon: iconAutoFix,
									action: intent("infer-variables"),
								},
							]
						: []),
					{
						id: newId(),
						name: "View saved queries",
						icon: iconStar,
						action: intent("open-saved-queries"),
					},
					{
						id: newId(),
						name: "View query history",
						icon: iconHistory,
						action: intent("open-query-history"),
					},
					{
						id: newId(),
						name: "Create new query",
						icon: iconPlus,
						action: intent("new-query"),
					},
				],
			},
			{
				name: "Explorer",
				commands: [
					{
						id: newId(),
						name: "Import database",
						icon: iconUpload,
						action: intent("import-database"),
					},
					{
						id: newId(),
						name: "Export database",
						icon: iconDownload,
						action: intent("export-database"),
					},
				],
			},
			{
				name: "GraphQL",
				commands:
					activeView === "graphql"
						? [
								{
									id: newId(),
									name: "Run query",
									icon: iconPlay,
									shortcut: ["F9", "mod enter"],
									action: intent("run-graphql-query"),
								},
								{
									id: newId(),
									name: "Format query",
									icon: iconText,
									action: intent("format-graphql-query"),
								},
								{
									id: newId(),
									name: "Toggle variables panel",
									icon: iconBraces,
									action: intent("toggle-graphql-variables"),
								},
								{
									id: newId(),
									name: "Infer variables from query",
									icon: iconAutoFix,
									action: intent("infer-graphql-variables"),
								},
							]
						: [],
			},
			{
				name: "Authentication",
				commands: [
					{
						id: newId(),
						name: "Create root user",
						icon: iconAuth,
						action: intent("create-user", { level: "ROOT" }),
					},
					{
						id: newId(),
						name: "Create namespace user",
						icon: iconFolderSecure,
						action: intent("create-user", { level: "NAMESPACE" }),
					},
					{
						id: newId(),
						name: "Create database user",
						icon: iconServerSecure,
						action: intent("create-user", { level: "DATABASE" }),
					},
					{
						id: newId(),
						name: "Create access",
						icon: iconAccountSecure,
						action: intent("create-access"),
					},
					...accessMethods.map((access) => ({
						id: newId(),
						name: `Register user with access method ${access.name}`,
						icon: iconAccountPlus,
						action: intent("register-user", { access: access.name }),
					})),
				],
			},
			{
				name: "API Docs",
				commands: CODE_LANGUAGES.map((lang) => ({
					id: newId(),
					name: `Preview snippets in ${lang.label}`,
					icon: iconAPI,
					action: intent("docs-switch-language", {
						lang: lang.value,
					}),
				})),
			},
		);
	}

	if (isDesktop) {
		categories.push({
			name: "Serving",
			commands: [
				{
					id: newId(),
					name: `${isServing ? "Stop" : "Start"} database serving`,
					icon: isServing ? iconStop : iconPlay,
					action: intent("toggle-serving"),
				},
				{
					id: newId(),
					name: "Open serving console",
					icon: iconConsole,
					action: intent("open-serving-console"),
				},
			],
		});
	}

	categories.push(
		{
			name: "Settings",
			commands: [
				...(isDesktop
					? [
							{
								id: newId(),
								name: "Increase interface zoom",
								icon: iconMagnifyPlus,
								shortcut: "mod +",
								action: intent("increase-window-scale"),
							},
							{
								id: newId(),
								name: "Decrease interface zoom",
								icon: iconMagnifyMinus,
								shortcut: "mod -",
								action: intent("decrease-window-scale"),
							},
							{
								id: newId(),
								name: "Toggle window always on top",
								icon: iconPin,
								shortcut: "F10",
								action: intent("toggle-pinned"),
							},
						]
					: []),
				{
					id: newId(),
					name: "Increase editor zoom",
					icon: iconTextBoxPlus,
					shortcut: "mod shift +",
					action: intent("increase-editor-scale"),
				},
				{
					id: newId(),
					name: "Decrease editor zoom",
					icon: iconTextBoxMinus,
					shortcut: "mod shift -",
					action: intent("decrease-editor-scale"),
				},
				{
					id: newId(),
					name: "Manage Preferences",
					icon: iconTune,
					action: intent("open-settings", { tab: "preferences" }),
				},
				{
					id: newId(),
					name: "Manage Templates",
					icon: iconServer,
					action: intent("open-settings", { tab: "templates" }),
				},
				...(isDesktop
					? [
							{
								id: newId(),
								name: "Manage Database Serving",
								icon: iconPlay,
								action: intent("open-settings", {
									tab: "serving",
								}),
							},
						]
					: []),
				{
					id: newId(),
					name: "Manage Data",
					icon: iconTransfer,
					action: intent("open-settings", { tab: "manage-data" }),
				},
				{
					id: newId(),
					name: "Manage Feature Flags",
					icon: iconFlag,
					action: intent("open-settings", { tab: "feature-flags" }),
				},
				{
					id: newId(),
					name: "View OSS Licenses",
					icon: iconBalance,
					action: intent("open-settings", { tab: "licenses" }),
					aliases: ["Manage OSS Licenses"],
				},
				{
					id: newId(),
					name: "View About",
					icon: iconHelp,
					action: intent("open-settings", { tab: "about" }),
				},
			],
		},
		{
			name: "Preferences",
			visibility: "searched",
			commands: preferences.map((pref) => ({
				id: newId(),
				name: pref.name,
				icon: iconWrench,
				action: preference(pref.controller),
			})),
		},
		{
			name: "Navigation",
			commands: [
				{
					id: newId(),
					name: "Open Settings",
					icon: iconCog,
					shortcut: ["mod", ","],
					action: intent("open-settings"),
				},
				{
					id: newId(),
					name: "Open Help & Support",
					icon: iconHelp,
					action: intent("open-help"),
				},
				{
					id: newId(),
					name: "Open Keyboard Shortcuts",
					icon: iconCommand,
					action: intent("open-keymap"),
				},
				{
					id: newId(),
					name: "Open latest news",
					icon: iconNewspaper,
					action: intent("open-news"),
				},
				{
					id: newId(),
					name: "Open mini generator",
					icon: iconWrench,
					aliases: ["mini"],
					action: intent("open-embedder"),
				},
				{
					id: newId(),
					name: "Search SurrealDB documentation",
					aliases: ["Docs"],
					icon: iconBook,
					shortcut: "mod j",
					action: intent("open-documentation"),
				},
				{
					id: newId(),
					name: "View release changelogs",
					icon: iconStar,
					action: intent("open-changelog"),
				},
				{
					id: newId(),
					name: "Download Desktop App",
					icon: iconDownload,
					action: intent("open-desktop-download"),
				},
				{
					id: newId(),
					name: "Open Database Screen",
					icon: iconServer,
					action: launch(() => {
						setActiveScreen("database");
					}),
				},
				...(isDesktop
					? [
							{
								id: newId(),
								name: "Check for updates",
								icon: iconDownload,
								action: launch(() => {
									(adapter as DesktopAdapter).checkForUpdates(true);
								}),
							},
						]
					: []),
			],
		},
		{
			name: "Developer",
			commands: [
				{
					id: newId(),
					name: "Open start screen",
					icon: iconChevronRight,
					action: launch(() => {
						setActiveScreen("start");
					}),
				},
				{
					id: newId(),
					name: "Reload window",
					icon: iconRefresh,
					action: launch(() => {
						location.reload();
					}),
				},
				{
					id: newId(),
					name: "Reset tours",
					icon: iconRoutes,
					action: launch(resetOnboardings),
				},
				{
					id: newId(),
					name: "Sync database schema",
					icon: iconReset,
					action: launch(syncConnectionSchema),
				},
				...(isDesktop
					? [
							{
								id: newId(),
								name: "Toggle developer tools",
								icon: iconWrench,
								action: launch(() => {
									(adapter as DesktopAdapter).toggleDevTools();
								}),
							},
						]
					: []),
				...(featureFlags.store.highlight_tool
					? [
							{
								id: newId(),
								name: "Highlight Tool",
								icon: iconWrench,
								action: intent("highlight-tool"),
							},
						]
					: []),
			],
		},
	);

	return categories;
}
