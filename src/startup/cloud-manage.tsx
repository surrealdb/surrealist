import "@mantine/core/styles.layer.css";
import "@mantine/notifications/styles.css";

import "../assets/styles/layers.scss";
import "../assets/styles/fonts.scss";
import "../assets/styles/global.scss";
import "../assets/styles/override.scss";

import "../adapter";
import "../util/markdown";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import posthog from "posthog-js";
import { createRoot } from "react-dom/client";
import { CloudManageScreen } from "~/screens/cloud-manage";
import { startConfigSync } from "~/util/config";
import { adapter } from "../adapter";
import { isProduction } from "../util/environment";

(async () => {
	dayjs.extend(relativeTime);

	// Initialize posthog
	if (isProduction) {
		posthog.init(import.meta.env.POSTHOG_KEY, {
			api_host: import.meta.env.POSTHOG_URL,
			autocapture: false,
		});
	}

	// Synchronize the config to the store
	await startConfigSync();

	// Initialize adapter
	await adapter.initialize();

	// Render the app component
	const root = document.querySelector("#root");

	if (!root) {
		throw new Error("Root element not found");
	}

	createRoot(root).render(<CloudManageScreen />);
})();
