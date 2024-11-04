export * from "./types";

import { type PropsWithChildren, createContext, useContext, useMemo } from "react";
import { type CommandCategory, useInternalCommandBuilder } from "./commands";

const CommandsContext = createContext<{
	categories: CommandCategory[];
	registry: Set<string>;
} | null>(null);

/**
 * Access the list of command categories
 */
export function useCommandCategories() {
	const ctx = useContext(CommandsContext);

	return ctx?.categories ?? [];
}

/**
 * Access the list of command categories
 */
export function useCommandNames() {
	const ctx = useContext(CommandsContext);

	return ctx?.registry ?? new Set();
}

export function CommandsProvider({ children }: PropsWithChildren) {
	const categories = useInternalCommandBuilder();

	const registry = useMemo(() => {
		const set = new Set<string>();

		for (const category of categories) {
			for (const command of category.commands) {
				if (set.has(command.id)) {
					throw new Error(`Duplicate command name: "${command.id}"`);
				}

				set.add(command.id);
			}
		}

		return set;
	}, [categories]);

	return (
		<CommandsContext.Provider value={{ categories, registry }}>
			{children}
		</CommandsContext.Provider>
	);
}
