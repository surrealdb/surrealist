import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

const { version, author } = JSON.parse(readFileSync('./package.json', 'utf8'));

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	clearScreen: false,
	envPrefix: ['VITE_', 'TAURI_'],
	server: {
		port: 1420,
		strictPort: true
	},
	build: {
		target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
		minify: process.env.TAURI_DEBUG ? false : 'esbuild',
		sourcemap: !!process.env.TAURI_DEBUG,
	},
	resolve: {
		alias: {
			'~': fileURLToPath(new URL('src', import.meta.url))
		}
	},
	css: {
		modules: {
			localsConvention: 'dashesOnly'
		}
	},
	define: {
		'import.meta.env.VERSION': `"${version}"`,
		'import.meta.env.AUTHOR': `"${author}"`
	}
});