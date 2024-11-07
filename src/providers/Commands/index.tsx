export * from "./types";

import { noop } from "@mantine/core";
import posthog from "posthog-js";
import { type PropsWithChildren, createContext, useContext, useMemo } from "react";
import { adapter } from "~/adapter";
import { useStable } from "~/hooks/stable";
import { dispatchIntent } from "~/hooks/url";
import { useConfigStore } from "~/stores/config";
import { useInternalCommandBuilder } from "./commands";
import type { Command, CommandCategory } from "./types";

const CommandsContext = createContext<{
	categories: CommandCategory[];
	registry: Map<string, Command>;
	keybinds: Map<string, string[]>;
	dispatchCommand: (command: string) => void;
} | null>(null);

/**
 * Retrieve the list of command categories
 */
export function useCommandCategories() {
	return useContext(CommandsContext)?.categories ?? [];
}

/**
 * Retrieve the command registry
 */
export function useCommandRegistry() {
	return useContext(CommandsContext)?.registry ?? new Map<string, Command>();
}

/**
 * Retrieve the configured command keybindings
 */
export function useCommandKeybinds() {
	return useContext(CommandsContext)?.keybinds ?? new Map<string, string[]>();
}

/**
 * Retrieve the command dispatcher function
 */
export function useCommandDispatcher() {
	return useContext(CommandsContext)?.dispatchCommand ?? noop;
}

export function CommandsProvider({ children }: PropsWithChildren) {
	const categories = useInternalCommandBuilder();
	const userKeybinds = useConfigStore((state) => state.keybindings);

	// Compute unique command registry
	const registry = useMemo(() => {
		const map = new Map<string, Command>();

		for (const category of categories) {
			for (const command of category.commands) {
				if (map.has(command.id)) {
					throw new Error(`Duplicate command name: "${command.id}"`);
				}

				map.set(command.id, command);
			}
		}

		return map;
	}, [categories]);

	// Compute the final keybinds map
	const keybinds = useMemo(() => {
		const base = new Map<string, string[]>();

		for (const [id, { binding, disabled }] of registry.entries()) {
			if (Array.isArray(binding) && disabled !== true) {
				base.set(id, binding);
			}
		}

		for (const [id, binding] of Object.entries(userKeybinds)) {
			if (registry.has(id)) {
				base.set(id, binding);
			}
		}

		return base;
	}, [registry, userKeybinds]);

	// Dispatch a href, intent, or launch command by id
	const dispatchCommand = useStable((command: string) => {
		const cmd = registry.get(command);

		if (!cmd) {
			adapter.warn("Commands", `Attempted to dispatch unknown command "${command}"`);
			return;
		}

		posthog.capture("execute_command", {
			command: cmd.name,
		});

		switch (cmd.action.type) {
			case "href": {
				adapter.openUrl(cmd.action.href);
				break;
			}
			case "intent": {
				dispatchIntent(cmd.action.intent, cmd.action.payload);
				break;
			}
			case "launch": {
				cmd.action.handler();
				break;
			}
			default: {
				throw new Error(
					`Unsupported command action type "${cmd.action.type}" for dispatch`,
				);
			}
		}
	});

	return (
		<CommandsContext.Provider value={{ categories, registry, keybinds, dispatchCommand }}>
			{children}
		</CommandsContext.Provider>
	);
}
