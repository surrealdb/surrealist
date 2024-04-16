import { adapter } from "~/adapter";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { openConnection } from "~/database";
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
	const config = await adapter.loadConfig();
	const merged = assign(useConfigStore.getState(), config);

	useConfigStore.setState(merged);

	// TODO include a ~300ms debounce
	useConfigStore.subscribe((state) => {
		adapter.saveConfig(state);
	});
}

/**
 * Watch for connection changes and open the connection if auto connect is enabled
 */
export function watchConnectionSwitch() {
	watchStore({
		initial: true,
		store: useConfigStore,
		select: (state) => state.activeConnection,
		then: (value) => {
			const autoConnect = getSetting("behavior", "autoConnect");

			if (autoConnect && value) {
				openConnection();
			}
		},
	});
}