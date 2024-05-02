import { useConfigStore } from "~/stores/config";
import { getConnection } from "./connection";
import { CODE_LANGUAGES, SANDBOX, VIEW_MODES } from "~/constants";
import { iconAPI, iconAccountPlus, iconAccountSecure, iconAuth, iconAutoFix, iconBalance, iconBook, iconBraces, iconChevronRight, iconClose, iconCog, iconConsole, iconDownload, iconEye, iconFlag, iconFolderSecure, iconHelp, iconHistory, iconMagnifyMinus, iconMagnifyPlus, iconNewspaper, iconPin, iconPlay, iconPlus, iconRefresh, iconReset, iconRoutes, iconSearch, iconServer, iconServerSecure, iconStar, iconStarPlus, iconStop, iconSurreal, iconText, iconTextBoxMinus, iconTextBoxPlus, iconUpload, iconWrench } from "./icons";
import { newId } from "./helpers";
import { useDatabaseStore } from "~/stores/database";
import { isDesktop } from "~/adapter";
import { IntentPayload, IntentType } from "./intents";
import { featureFlags } from "./feature-flags";
import { syncDatabaseSchema } from "./schema";
import { closeConnection } from "~/connection";

type LaunchAction = { type: "launch", handler: () => void };
type InsertAction = { type: "insert", content: string };
type HrefAction = { type: "href", href: string };
type IntentAction = { type: "intent", intent: IntentType, payload?: IntentPayload };

type Action = LaunchAction | InsertAction | HrefAction | IntentAction;

export interface Command {
	id: string;
	name: string;
	icon: string;
	shortcut?: string | string[];
	action: Action;
	aliases?: string[];
}

export interface CommandCategory {
	name: string;
	search?: boolean;
	commands: Command[];
}

/** Create a launch command */
const launch = (handler: () => void) => ({ type: 'launch', handler } as const);

/** Create an insertion command */
const insert = (content: string) => ({ type: 'insert', content } as const);

/** Create an href command */
const href = (href: string) => ({ type: 'href', href } as const);

/** Create an intent command */
const intent = (intent: IntentType, payload?: IntentPayload) => ({ type: "intent", intent, payload } as const);

/**
 * Compute available commands based on the current state
 */
export function computeCommands(): CommandCategory[] {
	const { activeView, connections, commandHistory, setActiveView, setActiveConnection, resetOnboardings } = useConfigStore.getState();
	const { isServing, databaseSchema, isConnected } = useDatabaseStore.getState();

	const activeCon = getConnection();
	const isSandbox = activeCon?.id === SANDBOX;
	const canDisconnect = isConnected && !isSandbox;
	const categories: CommandCategory[] = [];

	categories.push({
		name: 'History',
		search: false,
		commands: commandHistory.map(entry => ({
			id: newId(),
			name: entry,
			icon: iconSearch,
			action: insert(entry),
		}))
	}, {
		name: 'Connections',
		commands: [
			{
				id: newId(),
				name: `Open the Sandbox`,
				icon: iconSurreal,
				action: launch(() => {
					setActiveConnection(SANDBOX);
				})
			},
			...connections.map(connection => ({
				id: newId(),
				name: `Connect to ${connection.name}`,
				icon: iconServer,
				action: launch(() => {
					setActiveConnection(connection.id);
				})
			})),
			{
				id: newId(),
				name: `Create new connection`,
				icon: iconPlus,
				action: intent("new-connection")
			},
			...(canDisconnect ? [{
				id: newId(),
				name: `Disconnect from database`,
				icon: iconClose,
				action: launch(closeConnection)
			}] : [])
		]
	});

	if (activeCon) {
		const tables = databaseSchema?.tables || [];
		const scopes = databaseSchema?.scopes || [];

		categories.push({
			name: 'Views',
			commands: Object.values(VIEW_MODES).flatMap(view => view.disabled?.(featureFlags.store) ? [] : [{
				id: newId(),
				name: `Open ${view.name} view`,
				icon: view.icon,
				action: launch(() => {
					setActiveView(view.id);
				})
			}])
		}, {
			name: 'Tables',
			commands: [
				...tables.map(table => ({
					id: newId(),
					name: `Explore table ${table.schema.name}`,
					icon: iconChevronRight,
					action: intent("explore-table", { table: table.schema.name })
				})),
				...tables.map(table => ({
					id: newId(),
					name: `Design table ${table.schema.name}`,
					icon: iconChevronRight,
					action: intent("design-table", { table: table.schema.name })
				})),
				{
					id: newId(),
					name: `Create new table`,
					icon: iconPlus,
					action: intent("new-table")
				}
			]
		}, {
			name: 'Query',
			commands: [
				...(activeView === "query" ? [
					{
						id: newId(),
						name: "Run query",
						icon: iconPlay,
						shortcut: ["F9", "mod enter"],
						action: intent("run-query")
					},
					{
						id: newId(),
						name: "Save query",
						icon: iconStarPlus,
						action: intent("save-query")
					},
					{
						id: newId(),
						name: "Format query",
						icon: iconText,
						action: intent("format-query")
					},
					{
						id: newId(),
						name: "Toggle variables panel",
						icon: iconBraces,
						action: intent("toggle-variables")
					},
					{
						id: newId(),
						name: "Infer variables from query",
						icon: iconAutoFix,
						action: intent("infer-variables")
					}
				] : []),
				{
					id: newId(),
					name: "View saved queries",
					icon: iconStar,
					action: intent("open-saved-queries")
				},
				{
					id: newId(),
					name: "View query history",
					icon: iconHistory,
					action: intent("open-query-history")
				},
				{
					id: newId(),
					name: "Create new query",
					icon: iconPlus,
					action: intent("new-query")
				}
			]
		}, {
			name: 'Explorer',
			commands: [
				{
					id: newId(),
					name: "Import database",
					icon: iconUpload,
					action: intent("import-database")
				},
				{
					id: newId(),
					name: "Export database",
					icon: iconDownload,
					action: intent("export-database")
				}
			]
		}, {
			name: "Authentication",
			commands: [
				{
					id: newId(),
					name: "Create root user",
					icon: iconAuth,
					action: intent("create-user", { level: "ROOT" })
				},
				{
					id: newId(),
					name: "Create namespace user",
					icon: iconFolderSecure,
					action: intent("create-user", { level: "NAMESPACE" })
				},
				{
					id: newId(),
					name: "Create database user",
					icon: iconServerSecure,
					action: intent("create-user", { level: "DATABASE" })
				},
				{
					id: newId(),
					name: "Create scope",
					icon: iconAccountSecure,
					action: intent("create-scope")
				},
				...scopes.map(scope => ({
					id: newId(),
					name: `Register user in scope ${scope.name}`,
					icon: iconAccountPlus,
					action: intent("register-user", { scope: scope.name })
				}))
			]
		}, {
			name: "API Docs",
			commands: CODE_LANGUAGES.map(lang => ({
				id: newId(),
				name: `Preview snippets in ${lang.label}`,
				icon: iconAPI,
				action: intent("docs-switch-language", { lang: lang.value })
			}))
		});
	}

	if (isDesktop) {
		categories.push({
			name: "Serving",
			commands: [
				{
					id: newId(),
					name: `${isServing ? 'Stop' : 'Start'} database serving`,
					icon: isServing ? iconStop : iconPlay,
					action: intent("toggle-serving")
				},
				{
					id: newId(),
					name: "Open serving console",
					icon: iconConsole,
					action: intent("open-serving-console")
				},
			]
		});
	}

	categories.push({
		name: "Settings",
		commands: [
			...(isDesktop ? [{
				id: newId(),
				name: "Increase interface zoom",
				icon: iconMagnifyPlus,
				shortcut: "mod +",
				action: intent("increase-window-scale")
			},
			{
				id: newId(),
				name: "Decrease interface zoom",
				icon: iconMagnifyMinus,
				shortcut: "mod -",
				action: intent("decrease-window-scale")
			}, {
				id: newId(),
				name: "Toggle window always on top",
				icon: iconPin,
				shortcut: "F11",
				action: intent("toggle-pinned")
			}] : []),
			{
				id: newId(),
				name: "Increase editor zoom",
				icon: iconTextBoxPlus,
				shortcut: "mod shift +",
				action: intent("increase-editor-scale")
			},
			{
				id: newId(),
				name: "Decrease editor zoom",
				icon: iconTextBoxMinus,
				shortcut: "mod shift -",
				action: intent("decrease-editor-scale")
			},
			{
				id: newId(),
				name: "Manage Behaviour",
				icon: iconWrench,
				action: intent("open-settings", { tab: 'behaviour' })
			},
			{
				id: newId(),
				name: "Manage Appearance",
				icon: iconEye,
				action: intent("open-settings", { tab: 'appearance' })
			},
			{
				id: newId(),
				name: "Manage Templates",
				icon: iconServer,
				action: intent("open-settings", { tab: 'templates' }),
			},
			...(isDesktop ? [
				{
					id: newId(),
					name: "Manage Database Serving",
					icon: iconPlay,
					action: intent("open-settings", { tab: 'serving' }),
				}
			] : []),
			{
				id: newId(),
				name: "Manage Feature Flags",
				icon: iconFlag,
				action: intent("open-settings", { tab: 'feature-flags' })
			},
			{
				id: newId(),
				name: "View OSS Licenses",
				icon: iconBalance,
				action: intent("open-settings", { tab: 'licenses' }),
				aliases: ["Manage OSS Licenses"],
			},
		]
	}, {
		name: "Navigation",
		commands: [
			{
				id: newId(),
				name: "Open Settings",
				icon: iconCog,
				action: intent("open-settings")
			},
			{
				id: newId(),
				name: "Open Help & Support",
				icon: iconHelp,
				action: intent("open-help")
			},
			{
				id: newId(),
				name: "Open latest news",
				icon: iconNewspaper,
				action: intent("open-news")
			},
			{
				id: newId(),
				name: "Open embed generator",
				icon: iconWrench,
				aliases: ["mini"],
				action: intent("open-embedder")
			},
			{
				id: newId(),
				name: "Browse SurrealDB Docs",
				icon: iconBook,
				action: href("https://surrealdb.com/docs/")
			},
			{
				id: newId(),
				name: "Open version changelogs",
				icon: iconStar,
				action: intent("open-changelog"),
			},
			{
				id: newId(),
				name: "Download Desktop App",
				icon: iconDownload,
				action: intent('download-app'),
			}
		]
	}, {
		name: "Developer",
		commands: [
			{
				id: newId(),
				name: "Open start screen",
				icon: iconChevronRight,
				action: launch(() => {
					setActiveConnection(null);
				})
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
				action: launch(syncDatabaseSchema)
			}
		]
	});

	return categories;
}
