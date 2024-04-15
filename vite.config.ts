import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const { version, surreal } = JSON.parse(readFileSync('./package.json', 'utf8'));
const generatedDir = fileURLToPath(new URL('src/generated', import.meta.url));

if (!existsSync(generatedDir)) {
	throw new Error('Surrealist embed generated files not found. Run `make build-embed` to generate them.');
}

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
		rollupOptions: {
			input: {
				'surrealist': '/index.html',
				'embed-run': '/embed/run.html',
				'embed-new': '/embed/new.html'
			}
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
		'import.meta.env.POSTHOG': `"phc_Q5dvPPsAnEhuHR9sFACJqVGZtShguecgghSn1xOnjjE"`,
	}
});