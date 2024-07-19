import '@mantine/core/styles.layer.css';
import "@mantine/notifications/styles.css";

import "../assets/styles/layers.scss";
import "../assets/styles/fonts.scss";
import "../assets/styles/global.scss";
import "../assets/styles/override.scss";

import "../adapter";

import { createRoot } from "react-dom/client";
import { watchColorPreference, watchColorScheme, watchConfigStore } from '../util/background';
import { adapter } from '../adapter';
import { CloudManageScreen } from '~/screens/cloud-manage';
import { updateTitle } from '~/util/helpers';

(async () => {

	// Synchronize the config to the store
	await watchConfigStore();

	watchColorScheme();
	watchColorPreference();

	// Initialize adapter
	adapter.initialize();

	// Render the app component
	const root = document.querySelector("#root")!;

	createRoot(root).render(<CloudManageScreen />);

	// Update the title
	updateTitle();

})();