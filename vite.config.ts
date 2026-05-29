import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type PluginOption } from "vite";
import { compression } from "vite-plugin-compression2";
import { ViteImageOptimizer as images } from "vite-plugin-image-optimizer";
import { Mode, plugin as markdown } from "vite-plugin-markdown";
import { surreal, version } from "./package.json";

/** Project root (directory containing this config). */
const projectDir = dirname(fileURLToPath(import.meta.url));

/**
 * Some dependencies import Node builtins in code paths that still run in the
 * browser (`dom-to-svg` → PostCSS, `@surrealdb/ql-wasm` → optional `node:crypto`).
 * Vite replaces them with stubs that log on access; alias small browser-safe
 * implementations instead.
 * @see https://github.com/vitejs/vite/issues/9200
 */
const browserNodeBuiltinAliases = {
	path: resolve(projectDir, "node_modules/path-browserify/index.js"),
	"node:path": resolve(projectDir, "node_modules/path-browserify/index.js"),
	fs: resolve(projectDir, "src/util/node-fs-postcss-shim.ts"),
	"node:fs": resolve(projectDir, "src/util/node-fs-postcss-shim.ts"),
	url: resolve(projectDir, "src/util/node-url-postcss-shim.ts"),
	"node:url": resolve(projectDir, "src/util/node-url-postcss-shim.ts"),
	"source-map-js": resolve(projectDir, "node_modules/source-map-js/source-map.js"),
	"node:crypto": resolve(projectDir, "src/util/node-crypto-web-shim.ts"),
} as const;

const isTauri = !!process.env.TAURI_ENV_PLATFORM;
const isCompress = process.env.VITE_SURREALIST_COMPRESS !== "false";
const isPreview = process.env.VITE_SURREALIST_PREVIEW === "true";
const isDocker = process.env.VITE_SURREALIST_DOCKER === "true";

const ENTRYPOINTS = {
	surrealist: "/index.html",
	mini_embed: "/tools/mini-embed.html",
	auth_return: "/tools/auth-return.html",
	auth_launch: "/tools/auth-launch.html",
	cloud_callback: "/tools/cloud-callback.html",
	cloud_referral: "/tools/cloud-referral.html",
};

const TOOLS = {
	"tools/mini-embed.html": "mini/run/index.html",
	"tools/auth-return.html": "auth/return/index.html",
	"tools/auth-launch.html": "auth/launch/index.html",
	"tools/cloud-callback.html": "cloud/callback/index.html",
	"tools/cloud-referral.html": "cloud/referral/index.html",
};

const REWRITES = {
	"/auth/return": "/tools/auth-return.html",
	"/auth/launch": "/tools/auth-launch.html",
	"/cloud/callback": "/tools/cloud-callback.html",
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
		{
			name: "rewrite-routes",
			configureServer(server) {
				server.middlewares.use((req, _res, next) => {
					if (req.url) {
						const [pathname, query] = req.url.split("?", 2);
						const target = REWRITES[pathname];

						if (target) {
							req.url = query ? `${target}?${query}` : target;
						}
					}
					next();
				});
			},
		},
	];

	// Configure compression for web builds
	if (!isTauri && isCompress) {
		console.log("Compressing assets...");
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
	} else {
		console.log("Skipping compression for build");
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
			target: "es2022",
			minify: !process.env.TAURI_DEBUG,
			sourcemap: !!process.env.TAURI_DEBUG,
			rolldownOptions: {
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
						surreal: [
							"surrealdb",
							"@surrealdb/wasm",
							"@surrealdb/ql-wasm-2",
							"@surrealdb/ql-wasm-3",
						],
						lsp: ["@surrealdb/surrealql-language-server"],
					},
				},
			},
		},
		resolve: {
			alias: {
				...browserNodeBuiltinAliases,
				"~": fileURLToPath(new URL("src", import.meta.url)),
			},
		},
		css: {
			modules: {
				localsConvention: "dashesOnly",
			},
			preprocessorOptions: {
				scss: {
					additionalData: "@use '@surrealdb/ui/mixins' as *;",
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
			include: ["path-browserify"],
			exclude: [
				"@surrealdb/wasm",
				"@surrealdb/ql-wasm-2",
				"@surrealdb/ql-wasm-3",
				"@surrealdb/surrealql-language-server",
			],
			rolldownOptions: {
				transform: {
					target: "esnext",
				},
			},
		},
		assetsInclude: [
			"**/@surrealdb/wasm/dist/*.wasm",
			"**/@surrealdb/ql-wasm-2/dist/*.wasm",
			"**/@surrealdb/ql-wasm-3/dist/*.wasm",
			"**/@surrealdb/surrealql-language-server/*.wasm",
		],
	};
});
