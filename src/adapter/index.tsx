import { SurrealistAdapter } from "./base";
import { BrowserAdapter } from "./browser";
import { DesktopAdapter } from "./desktop";

export const adapter: SurrealistAdapter = "__TAURI__" in window ? new DesktopAdapter() : new BrowserAdapter();
