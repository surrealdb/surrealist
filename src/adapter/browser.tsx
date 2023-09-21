import { Result } from "~/typings/utilities";
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

	public async setWindowPinned() {
		throw new Error("Not supported");
	}

	public async openUrl(url: string) {
		window.open(url, '_blank');
	}

	public async saveFile(
		_title: string,
		defaultPath: string,
		_filters: any,
		content: () => Result<string>
	): Promise<boolean> {
		const file = new File([await content()], '', { type: 'text/plain' });
		const url = window.URL.createObjectURL(file);
		const el = document.createElement('a');

		el.style.display = 'none';
		document.body.append(el);

		el.href = url;
		el.download = defaultPath;
		el.click();

		window.URL.revokeObjectURL(url);
		el.remove();

		return true;
	}

	public async openFile(): Promise<string | null> {
		const el = document.createElement('input');

		el.type = 'file';
		el.style.display = 'none';

		el.click();

		return new Promise((resolve, reject) => {
			el.addEventListener('change', async () => {
				const text = await el.files?.[0]?.text();

				if (typeof text == 'string') {
					resolve(text);
				} else {
					resolve(null);
				}
			});

			el.addEventListener('error', async () => {
				reject(new Error('Failed to read file'));
			});
		});
	}

}
