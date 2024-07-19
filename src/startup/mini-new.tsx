import '@mantine/core/styles.layer.css';

import "../assets/styles/layers.scss";
import "../assets/styles/fonts.scss";
import "../assets/styles/global.scss";
import "../assets/styles/override.scss";

import { createRoot } from "react-dom/client";
import { MiniNewScreen } from '../screens/mini-new';

(async () => {
	const root = document.querySelector("#root")!;

	createRoot(root).render(<MiniNewScreen />);
})();