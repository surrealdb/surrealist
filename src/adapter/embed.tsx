import { SANDBOX } from "~/constants";
import { BrowserAdapter } from "./browser";
import { SurrealistConfig } from "~/types";
import { createBaseTab, createSandboxConnection } from "~/util/defaults";
import { showError } from "~/util/helpers";
import { getSurreal } from "~/util/surreal";

const DATASETS: Record<string, string> = {
	'surreal-deal': "https://surreal-demo-testing.s3.eu-west-2.amazonaws.com/surreal_deal_v1.surql"
};

export class EmbedAdapter extends BrowserAdapter {

	#datasetQuery: string | undefined;

	public async loadConfig() {
		const mainTab = createBaseTab();
		const params = new URL(document.location.toString()).searchParams;

		const {
			query,
			variables,
			dataset,
			setup,
			theme,
		} = Object.fromEntries(params.entries());
		
		// Initial query
		if (query) {
			mainTab.query = decodeURIComponent(query);
		}

		// Initial variables
		if (variables) {
			const vars = decodeURIComponent(variables);

			try {
				const parsed = JSON.parse(vars);

				mainTab.variables = JSON.stringify(parsed, null, 4);
			} catch {
				showError('Embed error', 'Variables could not be parsed');
			}
		}

		if (dataset) {
			const datasetUrl = DATASETS[dataset];

			if (datasetUrl) {
				this.#datasetQuery = await fetch(datasetUrl).then(res => res.text());
			} else {
				showError('Embed error', 'Dataset not recognised');
			}
		}

		console.log('mainTab', mainTab);

		const config = {
			activeConnection: SANDBOX,
			sandbox: {
				...createSandboxConnection(),
				activeQuery: mainTab.id,
				queries: [mainTab]
			}
		} satisfies Partial<SurrealistConfig>;

		return JSON.stringify(config);
	}

	public async saveConfig(config: string) {
		// noop
	}

	public initializeDataset() {
		if (this.#datasetQuery) {
			getSurreal()?.query(this.#datasetQuery);
		}
	}

}