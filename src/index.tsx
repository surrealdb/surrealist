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
import { watchColorPreference, watchColorScheme, watchConfigStore, watchConnectionSwitch, watchViewSwitch } from './util/background';

import "reactflow/dist/style.css";

(async () => {
	dayjs.extend(relativeTime);

	// Load the surrealist embed library
	await initEmbed(embedPath);

	initialize_embed();
	
	// Synchronize the config to the store
	await watchConfigStore();

	updateTitle();
	watchColorScheme();
	watchColorPreference();
	watchConnectionSwitch();
	watchViewSwitch();

	// Initialize monaco
	await document.fonts.ready;
	await initializeMonaco();

	// Render the app component
	const root = document.querySelector("#root")!;

	createRoot(root).render(<App />);

	// Check for updates
	// TODO Auto updater
	const { lastPromptedVersion, updateChecker } = useConfigStore.getState();

	if (adapter.isUpdateCheckSupported && updateChecker) {
		runUpdateChecker(lastPromptedVersion, false);
	}
})();