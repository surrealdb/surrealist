import { SurrealistAdapter } from "./base";

/**
 * Surrealist adapter for running as web app
 */
export class BrowserAdapter implements SurrealistAdapter {
	
	isServeSupported = false;
	isPinningSupported = false;
	isOpenURLSupported = false;
	isUpdateCheckSupported = false;
	isPromotionSupported = true;

	async setWindowTitle(title: string) {
		document.title = title;
	}

	async loadConfig() {
		return localStorage.getItem('surrealist:config') || '{}';
	}

	async saveConfig(config: string) {
		localStorage.setItem('surrealist:config', config);
	}

	async startDatabase() {
		throw new Error('Not supported');
	}

	async stopDatabase() {
		throw new Error('Not supported');
	}

	async togglePinned() {
		throw new Error('Not supported');
	}

	async openUrl() {
		throw new Error('Not supported');
	}

};