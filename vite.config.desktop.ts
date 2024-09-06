import { defineConfig } from "vite";
import { getDefaultConfig, getDefaultPlugins } from "./vite.config";

// https://vitejs.dev/config/
export default defineConfig((config) => {
	const defaultConfig = getDefaultConfig(config);

	return {
		...defaultConfig,
		plugins: [...getDefaultPlugins()],
	};
});
