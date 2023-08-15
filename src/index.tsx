import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { actions, store } from "./store";
import { App } from "./components/App";
import { loader } from "@monaco-editor/react";
import { initializeEditor } from "./util/editor";
import { runUpdateChecker } from "./util/updater";
import { updateTitle, watchNativeTheme } from "./util/helpers";
import { adapter } from "./adapter";

(async () => {
	dayjs.extend(relativeTime);

	// Load existing config
	const config = await adapter.loadConfig();

	store.dispatch(actions.initialize(config));

	const { lastPromptedVersion, updateChecker } = store.getState().config;

	// Check for updates
	if (adapter.isUpdateCheckSupported && updateChecker) {
		runUpdateChecker(lastPromptedVersion, false);
	}

	// Apply initial title
	updateTitle();

	// Render the app component
	const root = document.querySelector("#root")!;

	createRoot(root).render(
		<Provider store={store}>
			<App />
		</Provider>
	);

	// Init monaco
	await document.fonts.ready;

	const monaco = await loader.init();

	initializeEditor(monaco);

	// Listen for theme changes
	watchNativeTheme();
})();
