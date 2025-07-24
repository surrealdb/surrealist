import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react";
import { defineConfig, type PluginOption } from "vite";
import { compression } from "vite-plugin-compression2";
import { ViteImageOptimizer as images } from "vite-plugin-image-optimizer";
import { Mode, plugin as markdown } from "vite-plugin-markdown";
import { surreal, version } from "./package.json";

const isTauri = !!process.env.TAURI_ENV_PLATFORM;
const isPreview = process.env.VITE_SURREALIST_PREVIEW === "true";
const isDocker = process.env.VITE_SURREALIST_DOCKER === "true";

const ENTRYPOINTS = {
	surrealist: "/index.html",
	mini_embed: "/tools/mini-embed.html",
	auth_callback: "/tools/auth-callback.html",
	cloud_referral: "/tools/cloud-referral.html",
};

const TOOLS = {
	"tools/mini-embed.html": "mini/run/index.html",
	"tools/auth-callback.html": "cloud/callback/index.html", // TODO rename to cloud/callback
	"tools/cloud-referral.html": "cloud/referral/index.html",
};

export default defineConfig(({ mode }) => {
	// Required because we cannot pass a custom mode to tauri build
	mode = isPreview ? "preview" : mode;

	// Define base plugins
	const plugins: PluginOption[] = [
		images(),
		react(),
		markdown({
			mode: [Mode.HTML],
		}),
		legacy({
			modernTargets: "since 2021-01-01, not dead",
			modernPolyfills: true,
			renderLegacyChunks: false,
		}),
		{
			name: "rename-html",
			enforce: "post",
			generateBundle(_, bundle) {
				for (const chunk of Object.values(bundle)) {
					if (TOOLS[chunk.fileName]) {
						const endpoint = TOOLS[chunk.fileName];
						const target = dirname(resolve("dist", endpoint));
						mkdirSync(target, { recursive: true });
						chunk.fileName = endpoint;
					}
				}
			},
		},
	];

	// Configure compression for web builds
	if (!isTauri) {
		plugins.push(
			compression({
				deleteOriginalAssets: true,
				threshold: isDocker ? 100 : undefined,
				filename: isDocker ? undefined : (id) => id,
				include: isDocker
					? /assets\/.+\.(html|xml|css|json|js|mjs|svg|wasm)$/
					: /\.(wasm)$/,
			}),
		);
	}

	return {
		plugins,
		clearScreen: false,
		envPrefix: ["VITE_", "TAURI_"],
		server: {
			port: 1420,
			strictPort: true,
		},
		build: {
			target: "es2020",
			minify: process.env.TAURI_DEBUG ? false : "esbuild",
			sourcemap: !!process.env.TAURI_DEBUG,
			rollupOptions: {
				input: !isTauri ? ENTRYPOINTS : undefined,
				output: {
					experimentalMinChunkSize: 5000,
					manualChunks: {
						react: ["react", "react-dom"],
						codemirror: [
							"codemirror",
							"@surrealdb/codemirror",
							"@surrealdb/lezer",
							"@replit/codemirror-indentation-markers",
						],
						mantime: ["@mantine/core", "@mantine/hooks", "@mantine/notifications"],
						surreal: ["surrealdb", "@surrealdb/wasm", "@surrealdb/ql-wasm"],
					},
				},
			},
		},
		esbuild: {
			supported: {
				"top-level-await": true, //browsers can handle top-level-await features
			},
		},
		resolve: {
			alias: {
				"~": fileURLToPath(new URL("src", import.meta.url)),
			},
		},
		css: {
			modules: {
				localsConvention: "dashesOnly",
			},
			preprocessorOptions: {
				scss: {
					additionalData: '@use "~/assets/styles/mixins" as *;',
					api: "modern-compiler",
				},
			},
		},
		define: {
			"import.meta.env.DATE": JSON.stringify(new Date()),
			"import.meta.env.VERSION": JSON.stringify(version),
			"import.meta.env.SDB_VERSION": JSON.stringify(surreal),
			"import.meta.env.MODE": JSON.stringify(mode),
			"import.meta.env.GTM_ID": JSON.stringify("G-PVD8NEJ3Z2"),
		},
		optimizeDeps: {
			exclude: ["@surrealdb/wasm", "@surrealdb/ql-wasm"],
			esbuildOptions: {
				target: "esnext",
			},
		},
		assetsInclude: ["**/@surrealdb/wasm/dist/*.wasm", "**/@surrealdb/ql-wasm/dist/*.wasm"],
	};
});
