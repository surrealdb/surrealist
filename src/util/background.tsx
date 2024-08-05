import { adapter } from "~/adapter";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { getSetting, watchStore } from "./config";
import { assign, debounce } from "radash";
import { openConnection } from "~/screens/database/connection";
import { featureFlags } from "./feature-flags";
import { VIEW_MODES } from "~/constants";
import { useDatabaseStore } from "~/stores/database";
import { CONFIG_VERSION } from "./defaults";
import { SurrealistConfig } from "~/types";
import { showDowngradeWarningModal } from "./downgrade";

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
	const loadedConfig = await adapter.loadConfig();
	const config = assign<SurrealistConfig>(useConfigStore.getState(), loadedConfig);
	const compatible = config.configVersion <= CONFIG_VERSION;

	// Handle incompatible config versions
	if (!compatible) {
		setTimeout(showDowngradeWarningModal, 250);
		return;
	}

	// Update the internal config state
	useConfigStore.setState(config);

	// Sync the config with the adapter
	useConfigStore.subscribe(debounce({
		delay: 250
	}, (state) => {
		adapter.saveConfig(state);
	}));
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