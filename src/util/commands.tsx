import { useConfigStore } from "~/stores/config";
import { getConnection } from "./connection";
import { SANDBOX, VIEW_MODES } from "~/constants";
import { iconAccountSecure, iconAuth, iconChevronRight, iconCog, iconConsole, iconDownload, iconFolderSecure, iconHelp, iconHistory, iconPlay, iconPlus, iconSearch, iconServer, iconServerSecure, iconStar, iconSurreal, iconUpload } from "./icons";
import { mdiBook, mdiMagnifyMinusOutline, mdiMagnifyPlusOutline, mdiPin, mdiTextBoxMinusOutline, mdiTextBoxPlusOutline } from "@mdi/js";
import { newId } from "./helpers";
import { useDatabaseStore } from "~/stores/database";
import { isDesktop } from "~/adapter";

type LaunchAction = { type: "launch", handler: () => void };
type InsertAction = { type: "insert", content: string };
type HrefAction = { type: "href", href: string };

type Action = LaunchAction | InsertAction | HrefAction;

export interface Command {
	id: string;
	name: string;
	icon: string;
	shortcut?: string;
	action: Action;
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

/**
 * Compute available commands based on the current state
 */
export function computeCommands(): CommandCategory[] {
	const { connections, commandHistory, setActiveView, setActiveConnection } = useConfigStore.getState();
	const { databaseSchema } = useDatabaseStore.getState();

	const activeCon = getConnection();
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
				action: launch(() => {
					// todo
				})
			}
		]
	});

	if (activeCon) {
		const tables = databaseSchema?.tables || [];

		categories.push({
			name: 'Views',
			commands: Object.values(VIEW_MODES).map(view => ({
				id: newId(),
				name: `Open ${view.name} view`,
				icon: view.icon,
				action: launch(() => {
					setActiveView(view.id);
				})
			}))
		}, {
			name: 'Tables',
			commands: [
				...tables.map(table => ({
					id: newId(),
					name: `Explore table ${table.schema.name}`,
					icon: iconChevronRight,
					action: launch(() => {
						// todo
					})
				})),
				...tables.map(table => ({
					id: newId(),
					name: `Design table ${table.schema.name}`,
					icon: iconChevronRight,
					action: launch(() => {
						// todo
					})
				})),
				{
					id: newId(),
					name: `Create new table`,
					icon: iconPlus,
					action: launch(() => {
						// todo
					})
				}
			]
		}, {
			name: 'Query',
			commands: [
				{
					id: newId(),
					name: "View saved queries",
					icon: iconStar,
					action: launch(() => {
						// todo
					})
				},
				{
					id: newId(),
					name: "View query history",
					icon: iconHistory,
					action: launch(() => {
						// todo
					})
				},
				{
					id: newId(),
					name: "Create new query",
					icon: iconPlus,
					action: launch(() => {
						// todo
					})
				}
			]
		}, {
			name: 'Explorer',
			commands: [
				{
					id: newId(),
					name: "Import database",
					icon: iconUpload,
					action: launch(() => {
						// todo
					})
				},
				{
					id: newId(),
					name: "Export database",
					icon: iconDownload,
					action: launch(() => {
						// todo
					})
				}
			]
		}, {
			name: "Authentication",
			commands: [
				{
					id: newId(),
					name: "Create root user",
					icon: iconAuth,
					action: launch(() => {
						// todo
					})
				},
				{
					id: newId(),
					name: "Create namespace user",
					icon: iconFolderSecure,
					action: launch(() => {
						// todo
					})
				},
				{
					id: newId(),
					name: "Create database user",
					icon: iconServerSecure,
					action: launch(() => {
						// todo
					})
				},
				{
					id: newId(),
					name: "Create scope",
					icon: iconAccountSecure,
					action: launch(() => {
						// todo
					})
				}
			]
		});
	}

	categories.push({
		name: "Serving",
		commands: [
			{
				id: newId(),
				name: "Start/Stop serving",
				icon: iconPlay,
				action: launch(() => {
					// todo
				})
			},
			{
				id: newId(),
				name: "Reveal output console",
				icon: iconConsole,
				action: launch(() => {
					// todo
				})
			},
		]
	}, {
		name: "Settings",
		commands: [
			...(isDesktop ? [{
				id: newId(),
				name: "Increase interface zoom",
				icon: mdiMagnifyPlusOutline,
				shortcut: "mod +",
				action: launch(() => {
					// todo
				})
			},
			{
				id: newId(),
				name: "Decrease interface zoom",
				icon: mdiMagnifyMinusOutline,
				shortcut: "mod -",
				action: launch(() => {
					// todo
				})
			}] : []),
			{
				id: newId(),
				name: "Increase editor zoom",
				icon: mdiTextBoxPlusOutline,
				shortcut: "mod shift +",
				action: launch(() => {
					// todo
				})
			},
			{
				id: newId(),
				name: "Decrease editor zoom",
				icon: mdiTextBoxMinusOutline,
				shortcut: "mod shift -",
				action: launch(() => {
					// todo
				})
			},
			{
				id: newId(),
				name: "Toggle window always on top",
				icon: mdiPin,
				shortcut: "F11",
				action: launch(() => {
					// todo
				})
			},
		]
	}, {
		name: "Navigation",
		commands: [
			{
				id: newId(),
				name: "Open Settings",
				icon: iconCog,
				action: launch(() => {
					// todo
				})
			},
			{
				id: newId(),
				name: "Open Help & Support",
				icon: iconHelp,
				action: launch(() => {
					// todo
				})
			},
			{
				id: newId(),
				name: "Browse SurrealDB Docs",
				icon: mdiBook,
				action: href("https://surrealdb.com/docs/")
			},
		]
	});

	return categories;
}