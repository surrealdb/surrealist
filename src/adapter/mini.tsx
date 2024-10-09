import type { MantineColorScheme } from "@mantine/core";
import { Value } from "@surrealdb/ql-wasm";
import { DATASETS, ORIENTATIONS, SANDBOX } from "~/constants";
import { executeQuery } from "~/screens/database/connection/connection";
import type { Orientation, SurrealistConfig } from "~/types";
import { createBaseSettings, createBaseTab, createSandboxConnection } from "~/util/defaults";
import { showError } from "~/util/helpers";
import { parseDatasetURL } from "~/util/surrealql";
import { BrowserAdapter } from "./browser";
import dedent from "dedent";

const THEMES = new Set(["light", "dark", "auto"]);

export class MiniAdapter extends BrowserAdapter {
	public transparent = false;
	public hideTitlebar = false;
	public hideBorder = false;

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
			borderless,
			transparent,
			orientation,
		} = Object.fromEntries(params.entries());

		// Hide titlebar
		if (compact !== undefined) {
			this.hideTitlebar = true;
		}

		// Borderless
		if (borderless !== undefined) {
			this.hideTitlebar = true;
			this.hideBorder = true;
		}

		// Transparent background
		if (transparent !== undefined) {
			this.transparent = true;
			document.body.style.backgroundColor = "transparent";
			document.documentElement.style.colorScheme = "unset";
		}

		// Initial query
		if (query) {
			mainTab.query = dedent(decodeURIComponent(query));
		}

		// Initial variables
		if (variables) {
			try {
				const parsed = Value.from_string(variables);
				mainTab.variables = dedent(parsed.format(true));
			} catch {
				showError({
					title: "Startup error",
					subtitle: "Variables could not be parsed",
				});
			}
		}

		// Premade dataset loading
		if (dataset) {
			const datasetUrl = parseDatasetURL(dataset);

			if (datasetUrl) {
				this.#datasetQuery = await fetch(datasetUrl).then((res) => res.text());
			} else {
				showError({
					title: "Startup error",
					subtitle: "Dataset not recognised",
				});
			}
		}

		// Execute a startup query
		if (setup) {
			this.#setupQuery = decodeURIComponent(setup);
		}

		// Interface theme
		if (theme) {
			if (THEMES.has(theme)) {
				settings.appearance.colorScheme = theme as MantineColorScheme;
			} else {
				showError({
					title: "Startup error",
					subtitle: "Theme not recognised",
				});
			}
		}

		// Orientation
		if (orientation) {
			if (ORIENTATIONS.some((o) => o.value === orientation)) {
				settings.appearance.queryOrientation = orientation as Orientation;
			} else {
				showError({
					title: "Startup error",
					subtitle: "Orientation not recognised",
				});
			}
		}

		return {
			settings,
			activeConnection: SANDBOX,
			sandbox: {
				...createSandboxConnection(settings),
				activeQuery: mainTab.id,
				queries: [mainTab],
			},
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
}
