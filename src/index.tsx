import "reactflow/dist/style.css";
import "@mantine/core/styles.layer.css";
import "@mantine/notifications/styles.css";
import "mantine-contextmenu/styles.layer.css";

import "./assets/styles/layers.scss";
import "./assets/styles/fonts.scss";
import "./assets/styles/global.scss";

import "./adapter";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import embedPath from './generated/surrealist-embed_bg.wasm?url';
import initEmbed, { initialize_embed } from './generated/surrealist-embed';
import { createRoot } from "react-dom/client";
import { App } from "./components/App";
import { initializeMonaco } from "./util/editor";
import { runUpdateChecker } from "./util/updater";
import { updateTitle } from "./util/helpers";
import { adapter } from "./adapter";
import { useConfigStore } from "./stores/config";
import { watchColorPreference, watchColorScheme, watchConfigStore, watchConnectionSwitch } from './util/background';
import { getSetting } from "./util/config";
import { generateEditorIcons } from "./util/editor/icons";
import posthog from 'posthog-js';
import { isProduction } from "./util/environment";

(async () => {
	dayjs.extend(relativeTime);

	// Initialize posthog
	if (isProduction) {
		posthog.init(import.meta.env.POSTHOG, {
			api_host: 'https://app.posthog.com',
			autocapture: false
		});
	}

	// Load the surrealist embed library
	await initEmbed(embedPath);

	initialize_embed();

	// Synchronize the config to the store
	await watchConfigStore();

	updateTitle();
	watchColorScheme();
	watchColorPreference();
	watchConnectionSwitch();

	// Initialize adapter
	adapter.initialize();

	// Generate editor icons
	generateEditorIcons();

	// Initialize monaco
	await document.fonts.ready;
	await initializeMonaco();

	// Render the app component
	const root = document.querySelector("#root")!;

	createRoot(root).render(<App />);

	// Check for updates
	// TODO Auto updater
	const { lastPromptedVersion } = useConfigStore.getState();
	const updateChecker = getSetting("behavior", "updateChecker");

	if (adapter.isUpdateCheckSupported && updateChecker) {
		runUpdateChecker(lastPromptedVersion, false);
	}

	// NOTE Temporary until react flow is fixed
	document.body.addEventListener('keydown', e => e.stopPropagation());

})();