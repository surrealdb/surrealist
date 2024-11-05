export * from "./types";

import { type PropsWithChildren, createContext, useContext, useMemo } from "react";
import { useInternalCommandBuilder } from "./commands";
import type { Command, CommandCategory } from "./types";

const CommandsContext = createContext<{
	categories: CommandCategory[];
	registry: Map<string, Command>;
} | null>(null);

/**
 * Access the list of command categories
 */
export function useCommandCategories() {
	const ctx = useContext(CommandsContext);

	return ctx?.categories ?? [];
}

/**
 * Access the command registry
 */
export function useCommandRegistry() {
	const ctx = useContext(CommandsContext);

	return ctx?.registry ?? new Map<string, Command>();
}

export function CommandsProvider({ children }: PropsWithChildren) {
	const categories = useInternalCommandBuilder();

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

	return (
		<CommandsContext.Provider value={{ categories, registry }}>
			{children}
		</CommandsContext.Provider>
	);
}
