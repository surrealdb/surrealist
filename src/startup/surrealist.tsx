import "@xyflow/react/dist/style.css";
import "@mantine/core/styles.layer.css";
import "@mantine/notifications/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/dates/styles.css";
import "mantine-contextmenu/styles.layer.css";
import "@surrealdb/ui/styles.css";
import "@surrealdb/ui/fonts.css";

import "../assets/styles/layers.scss";
import "../assets/styles/fonts.scss";
import "../assets/styles/global.scss";
import "../assets/styles/override.scss";
import "../assets/styles/variants.scss";

import "../adapter";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { createRoot } from "react-dom/client";
import { invalidateSession } from "~/cloud/api/auth";
import { clearCachedConnections } from "~/cloud/helpers";
import { NewDomainScreen } from "~/screens/new-domain";
import { startConfigSync } from "~/util/config";
import { exposeDebug } from "~/util/helpers";
import { preloadImages } from "~/util/preloader";
import { adapter } from "../adapter";
import { App } from "../components/App";
import { generateEditorIcons } from "../editor/icons";
import { promptChangelog } from "../util/changelogs";

(async () => {
	dayjs.extend(relativeTime);

	// Synchronize the config to the store
	await startConfigSync();

	// Initialize adapter
	await adapter.initialize();

	// Generate editor icons
	generateEditorIcons();

	// Render the app component
	const root = document.querySelector("#root");

	if (!root) {
		throw new Error("Root element not found");
	}

	// TODO - Temporary redirect notice
	if (location.host.endsWith("surrealist.app")) {
		createRoot(root).render(<NewDomainScreen />);
		return;
	}

	createRoot(root).render(<App />);

	// Check for new release
	promptChangelog();

	// Preload images
	preloadImages();

	// Expose debugging tools
	exposeDebug({
		invalidateSession,
		clearCachedConnections,
	});
})();
