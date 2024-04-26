import '@mantine/core/styles.layer.css';
import "@mantine/notifications/styles.css";

import "../assets/styles/layers.scss";
import "../assets/styles/fonts.scss";
import "../assets/styles/global.scss";

import "../adapter";

import { createRoot } from "react-dom/client";
import { watchColorPreference, watchColorScheme, watchConfigStore } from '../util/background';
import { adapter } from '../adapter';
import { MiniAdapter } from '../adapter/mini';
import { openConnection } from '~/connection';
import { MiniRunScaffold } from '~/components/Scaffold/mini/run';

(async () => {

	// Synchronize the config to the store
	await watchConfigStore();

	watchColorScheme();
	watchColorPreference();

	// Initialize adapter
	adapter.initialize();

	// Immedietely connect and initialize the dataset
	openConnection().then(() => {
		(adapter as MiniAdapter).initializeDataset();
	});

	// Render the app component
	const root = document.querySelector("#root")!;

	createRoot(root).render(<MiniRunScaffold />);

})();