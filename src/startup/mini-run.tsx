import '@mantine/core/styles.layer.css';
import "@mantine/notifications/styles.css";

import "../assets/styles/layers.scss";
import "../assets/styles/fonts.scss";
import "../assets/styles/global.scss";
import "../assets/styles/override.scss";

import "../adapter";

import { createRoot } from "react-dom/client";
import { adapter } from '../adapter';
import { MiniAdapter } from '../adapter/mini';
import { openConnection } from '~/screens/database/connection/connection';
import { handleWindowMessage } from '~/util/messaging';
import { MiniRunScreen } from '~/screens/mini-run';
import { startConfigSync } from '~/util/config';

(async () => {

	// Synchronize the config to the store
	await startConfigSync();

	// Initialize adapter
	await adapter.initialize();

	// Render the app component
	const root = document.querySelector("#root")!;

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