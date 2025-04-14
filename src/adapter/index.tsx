import type { SurrealistAdapter } from "./base";
import { BrowserAdapter } from "./browser";
import { DesktopAdapter } from "./desktop";
import { DockerAdapter } from "./docker";
import { MiniAdapter } from "./mini";

const useDesktop = "__TAURI_INTERNALS__" in window;
const useMini = document.querySelector("meta[name=surrealist-mini]");
const useDocker = process.env.VITE_SURREALIST_DOCKER === "true";

/**
 * The active environment adapter
 */
export const adapter: SurrealistAdapter = (() => {
	if (useMini) {
		return new MiniAdapter();
	}

	if (useDocker) {
		return new DockerAdapter();
	}

	if (useDesktop) {
		return new DesktopAdapter();
	}

	return new BrowserAdapter();
})();

export const isDesktop = adapter instanceof DesktopAdapter;
export const isBrowser = adapter instanceof BrowserAdapter;
export const isDocker = adapter instanceof DockerAdapter;
export const isMini = adapter instanceof MiniAdapter;
