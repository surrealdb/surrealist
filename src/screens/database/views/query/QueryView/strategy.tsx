import { adapter } from "~/adapter";
import { DesktopAdapter } from "~/adapter/desktop";
import { useConfigStore } from "~/stores/config";
import type { QueryTab } from "~/types";
import { showError } from "~/util/helpers";

export interface SaveStrategy {
	read: (tab: QueryTab) => Result<string>;
	write: (tab: QueryTab, query: string) => unknown;
}

// Strategy for saving and reading the query from the config store
const CONFIG_STRATEGY: SaveStrategy = {
	read: (tab) => tab.query,
	write: (tab, query) => {
		const { updateQueryTab } = useConfigStore.getState();

		updateQueryTab({
			id: tab.id,
			query,
		});
	},
};

// Strategy for saving and reading the query from the file system
const FILE_STRATEGY: SaveStrategy = {
	read: async (tab) => {
		if (!(adapter instanceof DesktopAdapter)) {
			return "";
		}

		try {
			return await adapter.readQueryFile(tab);
		} catch {
			showError({
				title: "Failed to load query",
				subtitle: "The query file could not be read",
			});

			return "";
		}
	},
	write: (tab, query) => {
		if (!(adapter instanceof DesktopAdapter)) {
			return;
		}

		adapter.writeQueryFile(tab, query);
	},
};

/**
 * Read the query from its source
 */
export function readQuery(tab: QueryTab): Result<string> {
	console.log("read query", tab);

	return tab.type === "file" ? FILE_STRATEGY.read(tab) : CONFIG_STRATEGY.read(tab);
}

/**
 * Write a query to its destination
 */
export function writeQuery(tab: QueryTab, query: string) {
	console.log("write query", tab, query);

	tab.type === "file" ? FILE_STRATEGY.write(tab, query) : CONFIG_STRATEGY.write(tab, query);
}
