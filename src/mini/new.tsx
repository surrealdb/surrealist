import '@mantine/core/styles.layer.css';

import "../assets/styles/layers.scss";
import "../assets/styles/fonts.scss";
import "../assets/styles/global.scss";

import { createRoot } from "react-dom/client";
import { MiniNewScaffold } from '../components/Scaffold/mini/new';

(async () => {
	const root = document.querySelector("#root")!;

	createRoot(root).render(<MiniNewScaffold />);
})();