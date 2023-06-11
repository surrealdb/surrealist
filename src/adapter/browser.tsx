import { getActiveSurreal } from "~/surreal";
import { TableDefinition } from "~/typings";
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

	async fetchSchema(): Promise<TableDefinition[]> {
		const surreal = getActiveSurreal();
		const dbResponse = await surreal.query('INFO FOR DB');
		const dbResult = dbResponse[0].result;

		if (!dbResult) {
			return [];
		}

		return Object.keys(dbResult.tb).map(name => ({
			schema: {
				name: name,
				view: null,
				drop: false,
				schemafull: false,
				permissions: {
					create: '',
					select: '',
					update: '',
					delete: ''
				}
			},
			fields: [],
			indexes: [],
			events: []
		}));
	}

	async validateQuery() {
		return null;
	}

	async validateWhereClause() {
		return true;
	}

};