import "./adapter";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import embedPath from './generated/surrealist-embed_bg.wasm?url';
import initEmbed, { initialize_embed } from './generated/surrealist-embed';
import { createRoot } from "react-dom/client";
import { App } from "./components/App";
import { initializeMonaco } from "./util/editor";
import { runUpdateChecker } from "./util/updater";
import { updateTitle, watchNativeTheme } from "./util/helpers";
import { adapter } from "./adapter";
import { useConfigStore } from "./stores/config";

import "reactflow/dist/style.css";

(async () => {
	dayjs.extend(relativeTime);

	// Load the surrealist embed library
	await initEmbed(embedPath);

	initialize_embed();

	// Check for updates
	const { lastPromptedVersion, updateChecker } = useConfigStore.getState();
	if (adapter.isUpdateCheckSupported && updateChecker) {
		runUpdateChecker(lastPromptedVersion, false);
	}

	// // Apply initial title
	updateTitle();

	// Listen for theme changes
	watchNativeTheme();

	// Init monaco
	await document.fonts.ready;
	await initializeMonaco();

	// Render the app component
	const root = document.querySelector("#root")!;

	createRoot(root).render(<App />);
})();