import compare from "semver-compare";
import { adapter } from "~/adapter";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { getSetting, watchStore } from "./config";
import { assign, debounce } from "radash";
import { openConnection } from "~/screens/database/connection";
import { featureFlags } from "./feature-flags";
import { VIEW_MODES } from "~/constants";
import { CONFIG_VERSION } from "./defaults";
import { SurrealistConfig } from "~/types";
import { showDowngradeWarningModal } from "./downgrade";
import { IntentEvent } from "./global-events";
import { createEventSubscription } from "~/hooks/event";
import { CODE_RES_KEY, STATE_RES_KEY } from "./storage";
import { checkSessionExpiry, verifyAuthentication, refreshAccess } from "~/screens/cloud-manage/auth";
import { applyMigrations } from "./migrator";
import { updateTitle } from "./helpers";

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
	const migrateConfig = applyMigrations(loadedConfig);
	const config = assign<SurrealistConfig>(useConfigStore.getState(), migrateConfig);
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
	
	setTimeout(updateTitle);
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
			const view = useConfigStore.getState().activeView;
			const info = VIEW_MODES[view];

			if (value) {
				openConnection();
			}

			if (info?.disabled?.(featureFlags.store)) {
				useConfigStore.getState().setActiveView("query");
			}
		},
	});
}

/**
 * Watch for cloud authentication changes
 */
export function watchCloudAuthentication() {
	const responseCode = sessionStorage.getItem(CODE_RES_KEY);
	const responseState = sessionStorage.getItem(STATE_RES_KEY);

	// Check for configured redirect response, otherwise
	// attempt to refresh the currently active session
	if (responseCode && responseState) {
		sessionStorage.removeItem(CODE_RES_KEY);
		sessionStorage.removeItem(STATE_RES_KEY);

		verifyAuthentication(responseCode, responseState);
	} else {
		refreshAccess();
	}

	// Listen for triggered responses
	createEventSubscription(IntentEvent, ({ type, payload }) => {
		if (type !== "cloud-callback") return;

		const { code, state } = payload as any;

		if (!code || !state) {
			adapter.warn("Cloud", "Invalid cloud callback payload");
			return;
		}

		verifyAuthentication(code, state);
	});

	// Automatically refresh the session before it expires
	setInterval(() => {
		checkSessionExpiry();
	}, 1000 * 60 * 3);

}