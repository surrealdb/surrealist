import { Platform } from "~/types";
import { OpenedBinaryFile, OpenedTextFile, SurrealistAdapter } from "./base";

/**
 * Surrealist adapter for running as web app
 */
export class BrowserAdapter implements SurrealistAdapter {

	public isServeSupported = false;
	public isUpdateCheckSupported = false;
	public hasTitlebar = true;
	public platform: Platform = "windows";

	public initialize() {
		const platform = navigator.platform.toLowerCase();

		if (platform.includes('win')) {
			this.platform = 'windows';
		} else if (platform.includes('mac') || platform.includes('darwin')) {
			this.platform = 'darwin';
		} else if (platform.includes('linux')) {
			this.platform = 'linux';
		}
	}

	public dumpDebug = async () => ({
		"Platform": "Web",
		"Navigator": navigator.userAgent,
	});

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

	public async openUrl(url: string) {
		window.open(url, '_blank');
	}

	public async saveFile(
		_title: string,
		defaultPath: string,
		_filters: any,
		content: () => Result<string | Blob | null>
	): Promise<boolean> {
		const result = await content();

		if (!result) {
			return false;
		}

		const file = (typeof result === 'string')
			? new File([result], '', { type: 'text/plain' })
			: result;

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

	public async openTextFile(): Promise<OpenedTextFile[]> {
		const el = document.createElement('input');

		el.type = 'file';
		el.style.display = 'none';

		el.click();

		return new Promise((resolve, reject) => {
			el.addEventListener('change', async () => {
				const files = [...(el.files ?? [])];
				const tasks = files.map(async (file) => ({
					name: file.name,
					content: await file.text(),
				}));

				const results = await Promise.all(tasks);

				resolve(results);
			});

			el.addEventListener('error', async () => {
				reject(new Error('Failed to read file'));
			});
		});
	}

	public async openBinaryFile(): Promise<OpenedBinaryFile[]> {
		const el = document.createElement('input');

		el.type = 'file';
		el.style.display = 'none';

		el.click();

		return new Promise((resolve, reject) => {
			el.addEventListener('change', async () => {
				const files = [...(el.files ?? [])];
				const tasks = files.map(async (file) => ({
					name: file.name,
					content: file,
				}));

				const results = await Promise.all(tasks);

				resolve(results);
			});

			el.addEventListener('error', async () => {
				reject(new Error('Failed to read file'));
			});
		});
	}

}
