import { adapter } from "~/adapter";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { getSetting, watchStore } from "./config";
import { assign } from "radash";
import { openConnection } from "~/screens/database/connection";
import { featureFlags } from "./feature-flags";
import { VIEW_MODES } from "~/constants";
import { useDatabaseStore } from "~/stores/database";
import { compare } from "semver";

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

	// TODO Temporary fix
	if (compare(import.meta.env.VERSION, merged.previousVersion) > 0) {
		merged.activeScreen = 'database';
	}

	useConfigStore.setState(merged);

	// TODO include a ~300ms debounce
	useConfigStore.subscribe((state) => {
		adapter.saveConfig(state);
	});
}

/**
 * Watch for connection changes, open the connection if auto connect is enabled,
 * and verify the active view.
 */
export function watchConnectionSwitch() {
	watchStore({
		initial: true,
		store: useConfigStore,
		select: (state) => state.activeConnection,
		then: (value) => {
			const autoConnect = getSetting("behavior", "autoConnect");
			const view = useConfigStore.getState().activeView;
			const info = VIEW_MODES[view];

			useDatabaseStore.getState().setIsConnecting(false);

			if (autoConnect && value) {
				openConnection();
			}

			if (info?.disabled?.(featureFlags.store)) {
				useConfigStore.getState().setActiveView("query");
			}
		},
	});
}