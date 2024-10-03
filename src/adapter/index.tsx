import type { SurrealistAdapter } from "./base";

export const adapter: SurrealistAdapter =
	"__TAURI_INTERNALS__" in window
		? await import("./desktop").then(({ DesktopAdapter }) => new DesktopAdapter())
		: document.querySelector("meta[name=surrealist-mini]")
			? await import("./mini").then(({ MiniAdapter }) => new MiniAdapter())
			: await import("./browser").then(({ BrowserAdapter }) => new BrowserAdapter());

export const isDesktop = adapter.id === "desktop";
export const isBrowser = adapter.id === "browser";
export const isMini = adapter.id === "mini";
