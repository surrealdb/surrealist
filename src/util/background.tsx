import { adapter } from "~/adapter";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { setEditorTheme } from "./editor";
import { getConnection } from "./connection";
import { openConnection } from "~/database";
import { fetchDatabaseSchema } from "./schema";

function savePreference({ matches }: { matches: boolean }) {
	useInterfaceStore.getState().setColorPreference(matches ? "light" : "dark");
}

/**
 * Watch for browser color preference changes and save them to the store
 */
export function watchColorPreference() {
	const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');

	savePreference(mediaQuery);

	mediaQuery.addEventListener('change', savePreference);
}

function computeColorScheme() {
	const { colorScheme } = useConfigStore.getState();
	const { colorPreference } = useInterfaceStore.getState();

	const actualScheme = colorScheme === "auto" ? colorPreference : colorScheme;

	useInterfaceStore.getState().setColorScheme(actualScheme);
	setEditorTheme(actualScheme);
}

/**
 * Watch for changes to the preferred and configured color schemes
 */
export function watchColorScheme() {
	computeColorScheme();

	useConfigStore.subscribe((state, prev) => {
		if (state.colorScheme !== prev.colorScheme) {
			computeColorScheme();
		}
	});

	useInterfaceStore.subscribe((state, prev) => {
		if (state.colorPreference !== prev.colorPreference) {
			computeColorScheme();
		}
	});
}

/**
 * Watch for changes to the store and save the config to the adapter
 */
export async function watchConfigStore() {
	const config = await adapter.loadConfig();

	useConfigStore.setState(JSON.parse(config));

	// TODO include a ~300ms debounce
	useConfigStore.subscribe((state) => {
		adapter.saveConfig(JSON.stringify(state));
	});
}

/**
 * Watch for connection changes and open the connection if auto connect is enabled
 */
export function watchConnectionSwitch() {
	const { autoConnect } = useConfigStore.getState();

	if (autoConnect && getConnection()) {
		openConnection();
	}

	useConfigStore.subscribe((state, prev) => {
		if (state.activeConnection !== prev.activeConnection && state.activeConnection && state.autoConnect) {
			openConnection();
		}
	});
}

/**
 * Watch for a change in active view
 */
export function watchViewSwitch() {
	useConfigStore.subscribe((state, prev) => {
		if (state.activeView !== prev.activeView) {
			fetchDatabaseSchema();
		}
	});
}