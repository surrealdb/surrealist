import { SurrealistAdapter } from "./base";
import { BrowserAdapter } from "./browser";
import { DesktopAdapter } from "./desktop";
import { MiniAdapter } from "./mini";

export const adapter: SurrealistAdapter = "__TAURI__" in window
	? new DesktopAdapter()
	: document.querySelector('meta[name=surrealist-mini]')
		? new MiniAdapter()
		: new BrowserAdapter();

export const isDesktop = adapter instanceof DesktopAdapter;
export const isBrowser = adapter instanceof BrowserAdapter;
export const isMini = adapter instanceof MiniAdapter;