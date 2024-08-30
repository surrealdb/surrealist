import '@mantine/core/styles.layer.css';

import "../assets/styles/layers.scss";
import "../assets/styles/global.scss";

import { createRoot } from "react-dom/client";
import { CloudCallbackScreen } from "~/screens/cloud-callback";

(async () => {
	const root = document.querySelector("#root")!;

	createRoot(root).render(<CloudCallbackScreen />);
})();