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
	iconFile,
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
} from "~/util/icons";

import { dash } from "radash";
import { useMemo } from "react";
import { adapter, isDesktop } from "~/adapter";
import type { DesktopAdapter } from "~/adapter/desktop";
import { CODE_LANGUAGES, SANDBOX, VIEW_MODES } from "~/constants";
import { useConnection, useConnections } from "~/hooks/connection";
import { closeConnection, openConnection } from "~/screens/database/connection/connection";
import { useConfigStore } from "~/stores/config";
import { useDatabaseStore } from "~/stores/database";
import { featureFlags } from "~/util/feature-flags";
import { optional } from "~/util/helpers";
import type { IntentPayload, IntentType } from "~/util/intents";
import { type PreferenceController, computePreferences } from "~/util/preferences";
import { syncConnectionSchema } from "~/util/schema";
import type { CommandCategory } from "./types";

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
export function useInternalCommandBuilder(): CommandCategory[] {
	const { setActiveView, setActiveConnection, setActiveScreen, resetOnboardings } =
		useConfigStore.getState();

	const connections = useConnections();
	const activeView = useConfigStore((state) => state.activeView);
	const commandHistory = useConfigStore((state) => state.commandHistory);
	const isServing = useDatabaseStore((state) => state.isServing);
	const currentState = useDatabaseStore((state) => state.currentState);
	const connectionSchema = useDatabaseStore((state) => state.connectionSchema);

	const activeCon = useConnection();
	const isSandbox = activeCon?.id === SANDBOX;
	const canDisconnect = currentState !== "disconnected" && !isSandbox;

	const preferences = useMemo(() => {
		return computePreferences().flatMap(({ name, preferences }) =>
			preferences.map((pref) => ({ ...pref, name: `${name} > ${pref.name}` })),
		);
	}, []);

	return useMemo(() => {
		const categories: CommandCategory[] = [];

		const isQuery = activeView === "query";
		const isGraphql = activeView === "graphql";

		categories.push(
			{
				name: "History",
				visibility: "unsearched",
				commands: commandHistory.map((entry, i) => ({
					id: `history-${i}`,
					name: entry,
					icon: iconSearch,
					action: insert(entry),
				})),
			},
			{
				name: "Connections",
				commands: [
					{
						id: "connect-sandbox",
						name: "Open the Sandbox",
						icon: iconSandbox,
						binding: true,
						action: launch(() => {
							setActiveConnection(SANDBOX);
						}),
					},
					...connections.map((connection) => ({
						id: `connect-${connection.id}`,
						name: `Connect to ${connection.name}`,
						icon: iconServer,
						binding: true,
						action: launch(() => {
							setActiveConnection(connection.id); // TODO Use open-connection intent
						}),
					})),
					{
						id: "new-connection",
						name: "Create new connection",
						icon: iconPlus,
						binding: true,
						action: intent("new-connection"),
					},
					{
						id: "reconnect",
						name: "Reconnect to database",
						icon: iconRefresh,
						binding: true,
						action: launch(openConnection),
					},
					...optional(
						canDisconnect && {
							id: "disconnect",
							name: "Disconnect from database",
							icon: iconClose,
							binding: true,
							action: launch(closeConnection),
						},
					),
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
						optional(
							!view.disabled?.(featureFlags.store) && {
								id: `open-view-${view.id}`,
								name: `Open ${view.name} View`,
								icon: view.icon,
								binding: true,
								action: launch(() => {
									setActiveView(view.id);
								}),
							},
						),
					),
				},
				{
					name: "Tables",
					commands: [
						...tables.map((table) => ({
							id: `explore-table-${table.schema.name}`,
							name: `Explore table ${table.schema.name}`,
							icon: iconChevronRight,
							action: intent("explore-table", {
								table: table.schema.name,
							}),
						})),
						...tables.map((table) => ({
							id: `design-table-${table.schema.name}`,
							name: `Design table ${table.schema.name}`,
							icon: iconChevronRight,
							action: intent("design-table", {
								table: table.schema.name,
							}),
						})),
						{
							id: "new-table",
							name: `Create new table`,
							icon: iconPlus,
							binding: ["mod", "n"],
							action: intent("new-table"),
						},
					],
				},
				{
					name: "Query",
					commands: [
						{
							id: "run-query",
							name: "Run query",
							icon: iconPlay,
							binding: ["mod", "enter"],
							action: intent("run-query"),
							disabled: !isQuery,
						},
						{
							id: "save-query",
							name: "Save query",
							icon: iconStarPlus,
							binding: true,
							action: intent("save-query"),
							disabled: !isQuery,
						},
						{
							id: "format-query",
							name: "Format query",
							icon: iconText,
							binding: true,
							action: intent("format-query"),
							disabled: !isQuery,
						},
						{
							id: "toggle-variables",
							name: "Toggle variables panel",
							icon: iconBraces,
							binding: true,
							action: intent("toggle-variables"),
							disabled: !isQuery,
						},
						{
							id: "infer-variables",
							name: "Infer variables from query",
							icon: iconAutoFix,
							binding: true,
							action: intent("infer-variables"),
							disabled: !isQuery,
						},
						{
							id: "query-saves",
							name: "View saved queries",
							icon: iconStar,
							binding: true,
							action: intent("open-saved-queries"),
						},
						{
							id: "query-history",
							name: "View query history",
							icon: iconHistory,
							binding: true,
							action: intent("open-query-history"),
						},
						{
							id: "new-query",
							name: "Create new query",
							icon: iconPlus,
							binding: ["mod", "t"],
							action: intent("new-query"),
						},
						{
							id: "close-query",
							name: "Close current query",
							icon: iconClose,
							binding: ["mod", "w"],
							action: intent("close-query"),
							disabled: !isQuery,
						},
						...optional(
							isDesktop && {
								id: "open-query-file",
								name: "Open query file...",
								icon: iconFile,
								binding: ["mod", "o"],
								action: launch(() => {
									(adapter as DesktopAdapter).openQueryFile();
								}),
							},
						),
					],
				},
				{
					name: "GraphQL",
					commands: [
						{
							id: "run-gql-query",
							name: "Run query",
							icon: iconPlay,
							binding: ["mod", "enter"],
							action: intent("run-graphql-query"),
							disabled: !isGraphql,
						},
						{
							id: "format-gql-query",
							name: "Format query",
							icon: iconText,
							binding: true,
							action: intent("format-graphql-query"),
							disabled: !isGraphql,
						},
						{
							id: "toggle-gql-variables",
							name: "Toggle variables panel",
							icon: iconBraces,
							binding: true,
							action: intent("toggle-graphql-variables"),
							disabled: !isGraphql,
						},
						{
							id: "infer-gql-variables",
							name: "Infer variables from query",
							icon: iconAutoFix,
							binding: true,
							action: intent("infer-graphql-variables"),
							disabled: !isGraphql,
						},
					],
				},
				{
					name: "Authentication",
					commands: [
						{
							id: "new-kv-user",
							name: "Create root user",
							icon: iconAuth,
							binding: true,
							action: intent("create-user", { level: "ROOT" }),
						},
						{
							id: "new-ns-user",
							name: "Create namespace user",
							icon: iconFolderSecure,
							binding: true,
							action: intent("create-user", { level: "NAMESPACE" }),
						},
						{
							id: "new-db-user",
							name: "Create database user",
							icon: iconServerSecure,
							binding: true,
							action: intent("create-user", { level: "DATABASE" }),
						},
						{
							id: "new-access",
							name: "Create access",
							icon: iconAccountSecure,
							binding: true,
							action: intent("create-access"),
						},
						...accessMethods.map((access) => ({
							id: `register-user-${access.name}`,
							name: `Register user with access method ${access.name}`,
							icon: iconAccountPlus,
							action: intent("register-user", { access: access.name }),
						})),
					],
				},
				{
					name: "API Docs",
					commands: CODE_LANGUAGES.map((lang) => ({
						id: `docs-lang-${lang.value}`,
						name: `Preview snippets in ${lang.label}`,
						icon: iconAPI,
						action: intent("docs-switch-language", {
							lang: lang.value,
						}),
					})),
				},
				{
					name: "Database",
					commands: [
						{
							id: "import-database",
							name: "Import database",
							icon: iconUpload,
							binding: true,
							action: intent("import-database"),
						},
						{
							id: "export-database",
							name: "Export database",
							icon: iconDownload,
							binding: true,
							action: intent("export-database"),
						},
					],
				},
			);
		}

		if (isDesktop) {
			categories.push({
				name: "Serving",
				commands: [
					{
						id: "toggle-serving",
						name: `${isServing ? "Stop" : "Start"} database serving`,
						icon: isServing ? iconStop : iconPlay,
						binding: true,
						action: intent("toggle-serving"),
					},
					{
						id: "open-serving-console",
						name: "Open serving console",
						icon: iconConsole,
						binding: true,
						action: intent("open-serving-console"),
					},
				],
			});
		}

		categories.push(
			{
				name: "Settings",
				commands: [
					...optional(
						isDesktop && [
							{
								id: "inc-win-scale",
								name: "Increase interface zoom",
								icon: iconMagnifyPlus,
								binding: ["mod", "equal"],
								action: intent("increase-window-scale"),
							},
							{
								id: "dec-win-scale",
								name: "Decrease interface zoom",
								icon: iconMagnifyMinus,
								binding: ["mod", "minus"],
								action: intent("decrease-window-scale"),
							},
							{
								id: "toggle-win-pinned",
								name: "Toggle window always on top",
								icon: iconPin,
								binding: ["F10"],
								action: intent("toggle-pinned"),
							},
						],
					),
					{
						id: "inc-edit-scale",
						name: "Increase editor zoom",
						icon: iconTextBoxPlus,
						binding: ["mod", "shift", "equal"],
						action: intent("increase-editor-scale"),
					},
					{
						id: "dec-edit-scale",
						name: "Decrease editor zoom",
						icon: iconTextBoxMinus,
						binding: ["mod", "shift", "minus"],
						action: intent("decrease-editor-scale"),
					},
					{
						id: "open-preferences",
						name: "Manage Preferences",
						icon: iconTune,
						action: intent("open-settings", { tab: "preferences" }),
					},
					{
						id: "open-keybindings",
						name: "Configure Keybindings",
						icon: iconCommand,
						action: intent("open-settings", { tab: "keybindings" }),
					},
					{
						id: "open-templates",
						name: "Manage Templates",
						icon: iconServer,
						action: intent("open-settings", { tab: "templates" }),
					},
					...optional(
						isDesktop && {
							id: "open-serving",
							name: "Manage Database Serving",
							icon: iconPlay,
							action: intent("open-settings", {
								tab: "serving",
							}),
						},
					),
					{
						id: "open-manage-data",
						name: "Manage Data",
						icon: iconTransfer,
						action: intent("open-settings", { tab: "manage-data" }),
					},
					{
						id: "open-feature-flags",
						name: "Manage Feature Flags",
						icon: iconFlag,
						action: intent("open-settings", { tab: "feature-flags" }),
					},
					{
						id: "open-licenses",
						name: "View OSS Licenses",
						icon: iconBalance,
						action: intent("open-settings", { tab: "licenses" }),
						aliases: ["Manage OSS Licenses"],
					},
					{
						id: "open-about",
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
					id: `pref-${dash(pref.name.toLowerCase())}`,
					name: pref.name,
					icon: iconWrench,
					action: preference(pref.controller),
				})),
			},
			{
				name: "Navigation",
				commands: [
					{
						id: "open-search",
						name: "Open Surrealist Search",
						icon: iconSearch,
						binding: ["mod", "k"],
						unlisted: true,
						action: intent("open-command-palette"),
					},
					{
						id: "open-connections",
						name: "Open connection list",
						aliases: ["connections"],
						icon: iconServer,
						binding: ["mod", "l"],
						action: intent("open-connections"),
					},
					{
						id: "open-settings",
						name: "Open Settings",
						icon: iconCog,
						binding: ["mod", ","],
						action: intent("open-settings"),
					},
					{
						id: "open-help",
						name: "Open Help & Support",
						icon: iconHelp,
						action: intent("open-help"),
					},
					{
						id: "open-news",
						name: "Open latest news",
						icon: iconNewspaper,
						action: intent("open-news"),
					},
					{
						id: "open-embedder",
						name: "Open mini generator",
						icon: iconWrench,
						aliases: ["mini"],
						action: intent("open-embedder"),
					},
					{
						id: "open-docs",
						name: "Search SurrealDB documentation",
						aliases: ["Docs"],
						icon: iconBook,
						binding: ["mod", "j"],
						action: intent("open-documentation"),
					},
					{
						id: "open-changelog",
						name: "View release changelogs",
						icon: iconStar,
						action: intent("open-changelog"),
					},
					{
						id: "open-desktop-download",
						name: "Download Desktop App",
						icon: iconDownload,
						action: intent("open-desktop-download"),
					},
					{
						id: "open-db-screen",
						name: "Open Database Screen",
						icon: iconServer,
						action: launch(() => {
							setActiveScreen("database");
						}),
					},
					...optional(
						isDesktop && {
							id: "check-updates",
							name: "Check for updates",
							icon: iconDownload,
							action: launch(() => {
								(adapter as DesktopAdapter).checkForUpdates(true);
							}),
						},
					),
				],
			},
			{
				name: "Developer",
				commands: [
					{
						id: "open-start-screen",
						name: "Open start screen",
						icon: iconChevronRight,
						action: launch(() => {
							setActiveScreen("start");
						}),
					},
					{
						id: "reload-win",
						name: "Reload window",
						icon: iconRefresh,
						action: launch(() => {
							location.reload();
						}),
					},
					{
						id: "reset-tours",
						name: "Reset tours",
						icon: iconRoutes,
						action: launch(resetOnboardings),
					},
					{
						id: "sync-schema",
						name: "Sync database schema",
						icon: iconReset,
						binding: true,
						action: launch(syncConnectionSchema),
					},
					...optional(
						isDesktop && {
							id: "toggle-dev-tools",
							name: "Toggle developer tools",
							icon: iconWrench,
							action: launch(() => {
								(adapter as DesktopAdapter).toggleDevTools();
							}),
						},
					),
					...optional(
						featureFlags.store.highlight_tool && {
							id: "highlight-tool",
							name: "Highlight Tool",
							icon: iconWrench,
							action: intent("highlight-tool"),
						},
					),
				],
			},
		);

		return categories;
	}, [
		activeCon,
		activeView,
		connections,
		connectionSchema,
		commandHistory,
		canDisconnect,
		isServing,
		preferences,
		setActiveView,
		setActiveConnection,
		setActiveScreen,
		resetOnboardings,
	]);
}
