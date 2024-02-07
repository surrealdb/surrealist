import '@mantine/core/styles.css';
import "@mantine/notifications/styles.css";

import "./adapter";

import "./assets/styles/fonts.scss";
import "./assets/styles/global.scss";

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
import { watchColorPreference, watchColorScheme, watchConfigStore } from './util/background';

import "reactflow/dist/style.css";
import { openConnection } from './database';
import { getConnection } from './util/connection';

(async () => {
	dayjs.extend(relativeTime);

	// Load the surrealist embed library
	await initEmbed(embedPath);

	initialize_embed();

	updateTitle();
	watchColorScheme();
	watchColorPreference();

	// Synchronize the config to the store
	await watchConfigStore();

	// Initialize monaco
	await document.fonts.ready;
	await initializeMonaco();

	// Render the app component
	const root = document.querySelector("#root")!;

	createRoot(root).render(<App />);

	// Check for updates
	// TODO Auto updater
	const { lastPromptedVersion, updateChecker, autoConnect } = useConfigStore.getState();

	if (adapter.isUpdateCheckSupported && updateChecker) {
		runUpdateChecker(lastPromptedVersion, false);
	}

	// Open connection
	if (autoConnect && getConnection()) {
		openConnection();
	}
})();