import react from '@vitejs/plugin-react';
import { defineConfig, PluginOption } from 'vite';
import { readFileSync, cpSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const { version, author, surreal } = JSON.parse(readFileSync('./package.json', 'utf8'));

function pages(): PluginOption {
	return {
		name: 'github-pages',

		writeBundle() {
			const from = fileURLToPath(new URL('dist/index.html', import.meta.url));
			const to = fileURLToPath(new URL('dist/404.html', import.meta.url));

			cpSync(from, to);
		}
	};
}

const generatedDir = fileURLToPath(new URL('src/generated', import.meta.url));

if (!existsSync(generatedDir)) {
	throw new Error('Surrealist embed generated files not found. Run `pnpm embed:build` to generate them.');
}

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react(), pages()],
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
		'import.meta.env.AUTHOR': `"${author}"`,
		'import.meta.env.SDB_VERSION': `"${surreal}"`,
	}
});