import "@mantine/core/styles.layer.css";

import "../assets/styles/override.scss";
import "../assets/styles/global.scss";

import { createRoot } from "react-dom/client";
import { AuthCallbackScreen } from "~/screens/auth-callback";

(async () => {
	const root = document.querySelector("#root");

	if (!root) {
		throw new Error("Root element not found");
	}

	createRoot(root).render(<AuthCallbackScreen />);
})();
