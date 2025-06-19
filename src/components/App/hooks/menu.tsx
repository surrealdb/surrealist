import { Menu, MenuItem, PredefinedMenuItem, Submenu } from "@tauri-apps/api/menu";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useMemo, useRef } from "react";
import { adapter } from "~/adapter";
import {
	Command,
	CommandPayload,
	useCommandCategories,
	useCommandDispatcher,
	useCommandKeybinds,
} from "~/providers/Commands";
import { AppMenu, AppMenuItem } from "~/types";
import { optional } from "~/util/helpers";

const SEPARATOR: AppMenuItem = {
	id: "separator",
	type: "Separator",
};

export function getMenuItems(): AppMenu[] {
	const isDarwin = adapter.platform === "darwin";
	const about: AppMenuItem = {
		id: "open-about",
		name: "About Surrealist",
		type: "Command",
	};

	const settings: AppMenuItem = {
		id: "open-settings",
		name: "Settings",
		type: "Command",
	};

	const surrealistMenu: AppMenu = {
		id: "surrealist",
		name: "Surrealist",
		items: [
			about,
			SEPARATOR,
			settings,
			SEPARATOR,
			{
				id: "hide",
				type: "Hide",
			},
			{
				id: "hide_others",
				type: "HideOthers",
			},
			{
				id: "show_all",
				type: "ShowAll",
			},
			SEPARATOR,
			{
				id: "quit",
				type: "Quit",
				name: "Quit Surrealist",
			},
		],
	};

	const fileMenu: AppMenu = {
		id: "file",
		name: "File",
		items: [
			{
				id: "new-window",
				name: "New Window",
				type: "Command",
			},
			{
				id: "new-connection",
				name: "New Connection",
				type: "Command",
			},
			SEPARATOR,
			{
				id: "open-query-file",
				name: "Open Query File",
				type: "Command",
			},
			SEPARATOR,
			{
				id: "import-database",
				name: "Import Database",
				type: "Command",
			},
			{
				id: "export-database",
				type: "Command",
				name: "Export Database",
			},
			SEPARATOR,
			{
				id: "open-search",
				name: "Open Command Palette",
				type: "Command",
			},
			{
				id: "open-docs",
				name: "Open Documentation Search",
				type: "Command",
			},
			{
				id: "open-connections",
				name: "Open Connection List",
				type: "Command",
			},
			...optional(!isDarwin && [SEPARATOR, settings]),
			SEPARATOR,
			{
				id: "close_window",
				type: "Custom",
				name: "Close Window",
				action: async () => {
					await getCurrentWindow().close();
				},
			},
		],
	};

	const viewMenu: AppMenu = {
		id: "view",
		name: "View",
		items: [
			{
				id: "toggle-win-pinned",
				name: "Toggle Pinned",
				type: "Command",
			},
			SEPARATOR,
			{
				id: "inc-win-scale",
				name: "Zoom In",
				type: "Command",
			},
			{
				id: "dec-win-scale",
				name: "Zoom Out",
				type: "Command",
			},
			SEPARATOR,
			{
				id: "inc-edit-scale",
				name: "Zoom In Editors",
				type: "Command",
			},
			{
				id: "dec-edit-scale",
				name: "Zoom Out Editors",
				type: "Command",
			},
			...optional(isDarwin && SEPARATOR),
		],
	};

	const editMenu: AppMenu = {
		id: "edit",
		name: "Edit",
		items: [
			{
				id: "undo",
				type: "Undo",
			},
			{
				id: "redo",
				type: "Redo",
			},
			SEPARATOR,
			{
				id: "cut",
				type: "Cut",
			},
			{
				id: "copy",
				type: "Copy",
			},
			{
				id: "paste",
				type: "Paste",
			},
		],
	};

	const helpMenu: AppMenu = {
		id: "help",
		name: "Help",
		items: [
			{
				id: "discord",
				type: "Custom",
				name: "Discord",
				action: () => {
					adapter.openUrl("https://discord.gg/surrealdb");
				},
			},
			{
				id: "github",
				type: "Custom",
				name: "GitHub",
				action: () => {
					adapter.openUrl("https://github.com/surrealdb");
				},
			},
			{
				id: "youtube",
				type: "Custom",
				name: "YouTube",
				action: () => {
					adapter.openUrl("https://www.youtube.com/@surrealdb");
				},
			},
			SEPARATOR,
			{
				id: "surrealdb_docs",
				type: "Custom",
				name: "SurrealDB Docs",
				action: () => {
					adapter.openUrl("https://surrealdb.com/docs/surrealdb");
				},
			},
			{
				id: "surrealist_docs",
				type: "Custom",
				name: "Surrealist Docs",
				action: () => {
					adapter.openUrl("https://surrealdb.com/docs/surrealist");
				},
			},
			SEPARATOR,
			{
				id: "fundamentals",
				type: "Custom",
				name: "Fundamentals Course",
				action: () => {
					adapter.openUrl("https://surrealdb.com/learn/fundamentals");
				},
			},
			{
				id: "book",
				type: "Custom",
				name: "Book",
				action: () => {
					adapter.openUrl("https://surrealdb.com/learn/book");
				},
			},
			SEPARATOR,
			{
				id: "report_issue",
				type: "Custom",
				name: "Report Issue",
				action: () => {
					adapter.openUrl("https://github.com/surrealdb/surrealist/issues/new/choose");
				},
			},
			...optional(!isDarwin && about),
		],
	};

	return [
		...optional(isDarwin && surrealistMenu),
		fileMenu,
		...optional(isDarwin && editMenu),
		viewMenu,
		helpMenu,
	];
}

async function setupNativeAppMenu(
	commands: Map<string, Command>,
	keybinds: Map<string, string[]>,
	dispatchCommand: (command: string, payload?: CommandPayload) => void,
) {
	const menuList = getMenuItems();
	const appMenu = await Menu.new({
		id: getCurrentWindow().label,
	});

	for (const menu of menuList || []) {
		const menuItems = [];

		for (const item of menu.items) {
			if (item.type === "Command") {
				const keybind = keybinds.get(item.id);
				const modifierMap: Record<string, string> = {
					mod: "CmdOrCtrl",
					meta: "CmdOrCtrl",
				};
				const accelerator = keybind
					? keybind
							.map((key) => modifierMap[key.toLowerCase()] || key.toUpperCase())
							.join("+")
					: undefined;

				const custom = await MenuItem.new({
					id: item.id,
					text: item.name ?? "Unnamed",
					enabled: !item.disabled && commands.has(item.id),
					action: () => {
						dispatchCommand(item.id, item.data);
					},
					accelerator: accelerator,
				});

				menuItems.push(custom);
				continue;
			}

			if (item.type !== "Custom") {
				const predefined = await PredefinedMenuItem.new({
					item: item.type,
				});

				menuItems.push(predefined);
				continue;
			}

			const custom = await MenuItem.new({
				id: item.id,
				text: item.name ?? "Unnamed",
				enabled: !item.disabled,
				action: item.action,
			});

			menuItems.push(custom);
		}

		const submenu = await Submenu.new({
			id: menu.id,
			text: menu.name,
			items: menuItems,
		});

		appMenu.append(submenu);
	}

	await appMenu.setAsAppMenu();
}

export function useNativeMenuBar() {
	const keybinds = useCommandKeybinds();
	const cmdCategories = useCommandCategories();
	const dispatchCommand = useCommandDispatcher();

	const commands = useMemo(() => {
		return cmdCategories.reduce((acc, category) => {
			for (const command of category.commands) {
				acc.set(command.id, command);
			}
			return acc;
		}, new Map<string, Command>());
	}, [cmdCategories]);

	const commandsRef = useRef(commands);
	const keybindsRef = useRef(keybinds);
	const dispatchCommandRef = useRef(dispatchCommand);

	// Keep refs up to date
	useEffect(() => {
		commandsRef.current = commands;
		keybindsRef.current = keybinds;
		dispatchCommandRef.current = dispatchCommand;
	}, [commands, keybinds, dispatchCommand]);

	useEffect(() => {
		getCurrentWindow().listen("tauri://focus", async () => {
			await setupNativeAppMenu(
				commandsRef.current,
				keybindsRef.current,
				dispatchCommandRef.current,
			);
		});

		return;
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Update whenever the keybinds or commands change
	useEffect(() => {
		setupNativeAppMenu(commands, keybinds, dispatchCommand);
	}, [commandsRef.current]);
}
