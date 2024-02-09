import '@mantine/core/styles.css';
import "@mantine/notifications/styles.css";

import "./adapter";

import "./assets/styles/fonts.scss";
import "./assets/styles/global.scss";

import embedPath from './generated/surrealist-embed_bg.wasm?url';
import initEmbed, { initialize_embed } from './generated/surrealist-embed';
import { createRoot } from "react-dom/client";
import { initializeMonaco } from "./util/editor";
import { watchColorPreference, watchColorScheme, watchConfigStore } from './util/background';
import { Embed } from './components/Embed';
import { openConnection } from './database';
import { useConfigStore } from './stores/config';

(async () => {

	// Load the surrealist embed library
	await initEmbed(embedPath);

	initialize_embed();
	
	// Synchronize the config to the store
	await watchConfigStore();

	watchColorScheme();
	watchColorPreference();

	// Initialize monaco
	await document.fonts.ready;
	await initializeMonaco();

	console.log('store =', useConfigStore.getState());

	// Immedietely connect
	openConnection();

	// Render the app component
	const root = document.querySelector("#root")!;

	createRoot(root).render(<Embed />);
})();