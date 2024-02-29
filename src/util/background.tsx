import { adapter } from "~/adapter";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { setEditorTheme } from "./editor";
import { getConnection } from "./connection";
import { openConnection } from "~/database";
import { fetchDatabaseSchema } from "./schema";
import { getSetting, watchStore } from "./config";
import { assign } from "radash";

const savePreference = ({ matches }: { matches: boolean }) => {
	useInterfaceStore.getState().setColorPreference(matches ? "light" : "dark");
};

/**
 * Watch for browser color preference changes and save them to the store
 */
export function watchColorPreference() {
	const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');

	savePreference(mediaQuery);

	mediaQuery.addEventListener('change', savePreference);
}

const computeColorScheme = () => {
	const colorScheme = getSetting("appearance", "colorScheme");
	const { colorPreference } = useInterfaceStore.getState();

	const actualScheme = colorScheme === "auto" ? colorPreference : colorScheme;

	useInterfaceStore.getState().setColorScheme(actualScheme);
	setEditorTheme(actualScheme);
};

/**
 * Watch for changes to the preferred and configured color schemes
 */
export function watchColorScheme() {
	computeColorScheme();

	watchStore({
		store: useConfigStore,
		select: (state) => state.settings.appearance.colorScheme,
		then: computeColorScheme,
	});

	watchStore({
		store: useInterfaceStore,
		select: (state) => state.colorPreference,
		then: computeColorScheme,
	});
}

/**
 * Watch for changes to the store and save the config to the adapter
 */
export async function watchConfigStore() {
	const config = JSON.parse(await adapter.loadConfig());
	const merged = assign(useConfigStore.getState(), config);

	console.log(merged);

	useConfigStore.setState(merged);

	// TODO include a ~300ms debounce
	useConfigStore.subscribe((state) => {
		adapter.saveConfig(JSON.stringify(state));
	});
}

/**
 * Watch for connection changes and open the connection if auto connect is enabled
 */
export function watchConnectionSwitch() {
	const autoConnect = getSetting("behavior", "autoConnect");

	if (autoConnect && getConnection()) {
		openConnection();
	}

	watchStore({
		initial: true,
		store: useConfigStore,
		select: (state) => state.activeConnection,
		then: (value) => {
			if (value) {
				openConnection();
			}
		},
	});
}

/**
 * Watch for a change in active view
 */
export function watchViewSwitch() {
	watchStore({
		store: useConfigStore,
		select: (state) => state.activeView,
		then: fetchDatabaseSchema,
	});
}