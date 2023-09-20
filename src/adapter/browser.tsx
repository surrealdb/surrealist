import { SurrealistAdapter } from "./base";

/**
 * Surrealist adapter for running as web app
 */
export class BrowserAdapter implements SurrealistAdapter {

	public isServeSupported = false;
	public isPinningSupported = false;
	public isUpdateCheckSupported = false;
	public isPromotionSupported = true;

	public async setWindowTitle(title: string) {
		document.title = title;
	}

	public async loadConfig() {
		return localStorage.getItem("surrealist:config") || "{}";
	}

	public async saveConfig(config: string) {
		localStorage.setItem("surrealist:config", config);
	}

	public async startDatabase() {
		throw new Error("Not supported");
	}

	public async stopDatabase() {
		throw new Error("Not supported");
	}

	public async togglePinned() {
		throw new Error("Not supported");
	}

	public async openUrl(url: string) {
		window.open(url, '_blank');
	}

}
