import { SurrealistAdapter } from "./base";
import { BrowserAdapter } from "./browser";
import { DesktopAdapter } from "./desktop";
import { EmbedAdapter } from "./embed";

export const adapter: SurrealistAdapter = "__TAURI__" in window
	? new DesktopAdapter()
	: document.querySelector('meta[name=embed]')
		? new EmbedAdapter()
		: new BrowserAdapter();

export const isDesktop = adapter instanceof DesktopAdapter;
export const isBrowser = adapter instanceof BrowserAdapter;
export const isEmbed = adapter instanceof EmbedAdapter;