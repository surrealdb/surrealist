import "@mantine/core/styles.layer.css";
import "@mantine/notifications/styles.css";

import "../assets/styles/layers.scss";
import "../assets/styles/fonts.scss";
import "../assets/styles/global.scss";
import "../assets/styles/override.scss";

import "../adapter";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { createRoot } from "react-dom/client";
import { openConnection } from "~/screens/database/connection/connection";
import { MiniRunScreen } from "~/screens/mini-run";
import { startConfigSync } from "~/util/config";
import { handleWindowMessage } from "~/util/messaging";
import { adapter } from "../adapter";
import type { MiniAdapter } from "../adapter/mini";

(async () => {
	dayjs.extend(relativeTime);

	// Synchronize the config to the store
	await startConfigSync();

	// Initialize adapter
	await adapter.initialize();

	// Render the app component
	const root = document.querySelector("#root");

	if (!root) {
		throw new Error("Root element not found");
	}

	createRoot(root).render(<MiniRunScreen />);

	// Connect and initialize the dataset
	openConnection().then(() => {
		setTimeout(() => {
			(adapter as MiniAdapter).initializeDataset();
		}, 150);
	});

	// Listen for window messages
	window.addEventListener("message", handleWindowMessage, false);
})();
