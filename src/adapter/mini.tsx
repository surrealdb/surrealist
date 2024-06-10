import { DATASETS, ORIENTATIONS, SANDBOX } from "~/constants";
import { BrowserAdapter } from "./browser";
import { Orientation, SurrealistConfig } from "~/types";
import { createBaseSettings, createBaseTab, createSandboxConnection } from "~/util/defaults";
import { showError } from "~/util/helpers";
import { executeQuery } from "~/screens/database/connection";
import { parseValue } from "~/util/surrealql";
import { Value } from "surrealql.wasm/v1";

const THEMES = new Set(['light', 'dark', 'auto']);

export class MiniAdapter extends BrowserAdapter {

	public hideTitlebar = false;

	#datasetQuery: string | undefined;
	#setupQuery: string | undefined;

	public async loadConfig() {
		const settings = createBaseSettings();
		const mainTab = createBaseTab(settings);
		const params = new URL(document.location.toString()).searchParams;

		const {
			query,
			variables,
			dataset,
			setup,
			theme,
			compact,
			orientation,
		} = Object.fromEntries(params.entries());

		// Hide titlebar
		if (compact !== undefined) {
			this.hideTitlebar = true;
		}

		// Initial query
		if (query) {
			mainTab.query = decodeURIComponent(query);
		}

		// Initial variables
		if (variables) {
			try {
				const parsed = Value.from_string(variables);
				mainTab.variables = parsed.format(true);
			} catch {
				showError({
					title: 'Startup error',
					subtitle: 'Variables could not be parsed'
				});
			}
		}

		// Premade dataset loading
		if (dataset) {
			const datasetUrl = DATASETS[dataset].url;

			if (datasetUrl) {
				this.#datasetQuery = await fetch(datasetUrl).then(res => res.text());
			} else {
				showError({
					title: 'Startup error',
					subtitle: 'Dataset not recognised'
				});
			}
		}

		// Execute a startup query
		if (setup) {
			this.#setupQuery = decodeURIComponent(setup);
		}

		// Interface theme
		if (theme && !THEMES.has(theme)) {
			showError({
				title: 'Startup error',
				subtitle: 'Theme not recognised'
			});
		}

		// Orientation
		if (orientation) {
			if (ORIENTATIONS.some(o => o.value === orientation)) {
				settings.appearance.queryOrientation = orientation as Orientation;
			} else {
				showError({
					title: 'Startup error',
					subtitle: 'Orientation not recognised'
				});
			}
		}

		return {
			settings,
			activeConnection: SANDBOX,
			sandbox: {
				...createSandboxConnection(settings),
				activeQuery: mainTab.id,
				queries: [mainTab]
			}
		} satisfies DeepPartial<SurrealistConfig>;
	}

	public async saveConfig() {
		// noop
	}

	public initializeDataset() {
		if (this.#datasetQuery) {
			executeQuery(this.#datasetQuery);
		}

		if (this.#setupQuery) {
			executeQuery(this.#setupQuery);
		}
	}

	public async hasLegacyConfig() {
		return false;
	}

	public async getLegacyConfig() {
		// not applicable
	}

	public async handleLegacyCleanup() {
		// not applicable
	}

}
