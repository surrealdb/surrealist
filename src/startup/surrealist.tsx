import "reactflow/dist/style.css";
import "@mantine/core/styles.layer.css";
import "@mantine/notifications/styles.css";
import "mantine-contextmenu/styles.layer.css";

import "../assets/styles/layers.scss";
import "../assets/styles/fonts.scss";
import "../assets/styles/global.scss";
import "../assets/styles/override.scss";

import "../adapter";

import dayjs from "dayjs";
import posthog from 'posthog-js';
import relativeTime from "dayjs/plugin/relativeTime";
import { createRoot } from "react-dom/client";
import { App } from "../components/App";
import { updateTitle } from "../util/helpers";
import { adapter } from "../adapter";
import { watchCloudAuthentication, watchColorPreference, watchColorScheme, watchConfigStore, watchConnectionSwitch } from '../util/background';
import { generateEditorIcons } from "../util/editor/icons";
import { isProduction } from "../util/environment";
import { promptChangelog } from "../util/changelogs";

(async () => {
	dayjs.extend(relativeTime);

	// Initialize posthog
	if (isProduction) {
		posthog.init(import.meta.env.POSTHOG_KEY, {
			api_host: import.meta.env.POSTHOG_URL,
			autocapture: false
		});
	}

	// Synchronize the config to the store
	await watchConfigStore();

	updateTitle();
	watchColorScheme();
	watchColorPreference();
	watchConnectionSwitch();
	watchCloudAuthentication();

	// Initialize adapter
	adapter.initialize();

	// Generate editor icons
	generateEditorIcons();

	// Render the app component
	const root = document.querySelector("#root")!;
	createRoot(root).render(<App />);

	// Check for new release
	promptChangelog();
})();