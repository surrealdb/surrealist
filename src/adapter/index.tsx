import type { SurrealistAdapter } from "./base";

export const adapter: SurrealistAdapter =
	"__TAURI_INTERNALS__" in window
		? new (await import("./desktop")).DesktopAdapter()
		: document.querySelector("meta[name=surrealist-mini]")
			? new (await import("./mini")).MiniAdapter()
			: new (await import("./browser")).BrowserAdapter();

export const isDesktop = adapter.id === "desktop";
export const isBrowser = adapter.id === "browser";
export const isMini = adapter.id === "mini";
