import '@mantine/core/styles.layer.css';
import "@mantine/notifications/styles.css";

import "../assets/styles/layers.scss";
import "../assets/styles/fonts.scss";
import "../assets/styles/global.scss";
import "../assets/styles/override.scss";

import "../adapter";

import dayjs from "dayjs";
import posthog from 'posthog-js';
import relativeTime from "dayjs/plugin/relativeTime";
import { createRoot } from "react-dom/client";
import { adapter } from '../adapter';
import { CloudManageScreen } from '~/screens/cloud-manage';
import { isProduction } from "../util/environment";
import { startConfigSync } from '~/util/config';

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
	await startConfigSync();

	// Initialize adapter
	await adapter.initialize();

	// Render the app component
	const root = document.querySelector("#root")!;

	createRoot(root).render(<CloudManageScreen />);

})();