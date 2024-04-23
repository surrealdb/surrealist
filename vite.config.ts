import react from '@vitejs/plugin-react';
import { Mode, plugin as markdown } from 'vite-plugin-markdown';
import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const { version, surreal } = JSON.parse(readFileSync('./package.json', 'utf8'));

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		markdown({
			mode: [Mode.HTML]
		})
	],
	clearScreen: false,
	envPrefix: ['VITE_', 'TAURI_'],
	server: {
		port: 1420,
		strictPort: true
	},
	build: {
		target: "esnext",
		minify: process.env.TAURI_DEBUG ? false : 'esbuild',
		sourcemap: !!process.env.TAURI_DEBUG,
		rollupOptions: {
			input: {
				'surrealist': '/index.html',
				'mini-run': '/mini/run.html',
				'mini-new': '/mini/new.html'
			}
		},
	},
	esbuild: {
		supported: {
			'top-level-await': true //browsers can handle top-level-await features
		},
	},
	resolve: {
		alias: {
			'~': fileURLToPath(new URL('src', import.meta.url))
		}
	},
	css: {
		modules: {
			localsConvention: 'dashesOnly'
		},
		preprocessorOptions: {
			scss: {
				additionalData: '@import "~/assets/styles/mixins.scss";',
			},
		},
	},
	define: {
		'import.meta.env.VERSION': `"${version}"`,
		'import.meta.env.SDB_VERSION': `"${surreal}"`,
		'import.meta.env.POSTHOG_KEY': `"phc_BWVuHaJuhnFi3HthLhb9l8opktRrNeFHVnisZdQ5404"`,
		'import.meta.env.POSTHOG_URL': `"https://eu.posthog.com"`,
	},
	optimizeDeps: {
		exclude: ['surrealdb.wasm', 'surrealql.wasm'],
		esbuildOptions: {
			target: 'esnext',
		},
	},
	assetsInclude: ['**/surrealdb.wasm/dist/*.wasm', '**/surrealql.wasm/dist/*.wasm']
});
