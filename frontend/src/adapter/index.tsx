import { SurrealistAdapter } from "./base";
import { BrowserAdapter } from "./browser";
import { DesktopAdapter } from "./desktop";

export const adapter: SurrealistAdapter = 'wails' in window
	? new DesktopAdapter()
	: new BrowserAdapter();