import "@xyflow/react/dist/style.css";
import "@mantine/core/styles.layer.css";
import "@mantine/notifications/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/dates/styles.css";
import "mantine-contextmenu/styles.layer.css";
import "@surrealdb/ui/styles.css";
import "@surrealdb/ui/fonts.css";

import "../assets/styles/layers.scss";
import "../assets/styles/global.scss";
import "../assets/styles/override.scss";
import "../assets/styles/variants.scss";

import "../adapter";

import { createRoot } from "react-dom/client";
import { clearCachedConnections } from "~/cloud/helpers";
import { startConfigSync } from "~/util/config";
import { exposeDebug } from "~/util/helpers";
import { preloadImages } from "~/util/preloader";
import { initializeReo } from "~/util/reo";
import { configureDayjs } from "~/util/timezone";
import { adapter } from "../adapter";
import { App } from "../components/App";
import { generateEditorIcons } from "../editor/icons";
import { promptChangelog } from "../util/changelogs";

(async () => {
	configureDayjs();

	// Synchronize the config to the store
	await startConfigSync();

	// Initialize adapter
	await adapter.initialize();

	// Initialize Reo
	initializeReo();

	// Generate editor icons
	generateEditorIcons();

	// Render the app component
	const root = document.querySelector("#root");

	if (!root) {
		throw new Error("Root element not found");
	}

	// Render Surrealist app
	createRoot(root).render(<App />);

	// Check for new release
	promptChangelog();

	// Preload images
	preloadImages();

	// Expose debugging tools
	exposeDebug({
		clearCachedConnections,
	});
})();
