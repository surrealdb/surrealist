import { defineConfig } from 'vite';
import { compression } from 'vite-plugin-compression2';
import { getDefaultConfig, getDefaultPlugins } from './vite.config';

// https://vitejs.dev/config/
export default defineConfig((config) => {
	const defaultConfig = getDefaultConfig(config);

	return {
		...defaultConfig,
		plugins: [
			...getDefaultPlugins(),
			compression({
				threshold: 100,
				deleteOriginalAssets: true,
				include: /\.(html|xml|css|json|js|mjs|svg|wasm)$/
			})
		]
	};
});