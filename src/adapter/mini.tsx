import type { MantineColorScheme } from "@mantine/core";
import { Value } from "@surrealdb/ql-wasm";
import { ORIENTATIONS, SANDBOX } from "~/constants";
import { executeQuery, executeUserQuery } from "~/screens/database/connection/connection";
import type { MiniAppearance, Orientation, SurrealistConfig } from "~/types";
import { dedent } from "~/util/dedent";
import { createBaseQuery, createBaseSettings, createSandboxConnection } from "~/util/defaults";
import { showError } from "~/util/helpers";
import { broadcastMessage } from "~/util/messaging";
import { parseDatasetURL } from "~/util/surrealql";
import { BrowserAdapter } from "./browser";

const THEMES = new Set(["light", "dark", "auto"]);

export class MiniAdapter extends BrowserAdapter {
	public readonly id: string = "mini";

	public appearance: MiniAppearance = "normal";
	public corners: string | undefined = undefined;
	public transparent = false;
	public nonumbers = false;
	public uniqueRef = "";
	public autorun = false;

	#datasetQuery: string | undefined;
	#setupQuery: string | undefined;

	public async loadConfig() {
		const settings = createBaseSettings();
		const mainTab = createBaseQuery(settings, "config");
		const params = new URL(document.location.toString()).searchParams;

		const {
			ref,
			query,
			variables,
			dataset,
			setup,
			theme,
			appearance,
			corners,
			transparent,
			orientation,
			nonumbers,
			autorun,
			// deprecated
			compact,
			borderless,
		} = Object.fromEntries(params.entries());

		// Unique reference id
		if (ref !== undefined) {
			this.uniqueRef = ref;
		}

		// Appearance
		if (appearance !== undefined) {
			this.appearance = appearance as MiniAppearance;
		}

		// Panel corners
		if (corners !== undefined) {
			this.corners = corners;
		}

		// Hide titlebar (deprecated)
		if (compact !== undefined) {
			console.warn("The compact property is deprecated, please use appearance compact");
			this.appearance = "compact";
		}

		// Borderless (deprecated)
		if (borderless !== undefined) {
			console.warn("The borderless property is deprecated, please use appearance plain");
			this.appearance = "plain";
		}

		// Transparent background
		if (transparent !== undefined) {
			this.transparent = bool(transparent);
			document.body.style.backgroundColor = "transparent";
			document.documentElement.style.colorScheme = "unset";
		}

		// Initial query
		if (query) {
			mainTab.query = dedent(query);
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
			this.#setupQuery = setup;
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

		// Autorun query
		if (autorun !== undefined) {
			this.autorun = bool(autorun);
		}

		// Hide line numbers
		if (nonumbers !== undefined) {
			this.nonumbers = bool(nonumbers);
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

	public initializeContent() {
		if (this.#datasetQuery) {
			executeQuery(this.#datasetQuery);
		}

		if (this.#setupQuery) {
			executeQuery(this.#setupQuery);
		}

		if (this.autorun) {
			executeUserQuery();
		}
	}

	public broadcastReady() {
		const opts: any = {};

		if (this.uniqueRef) {
			opts.ref = this.uniqueRef;
		}

		broadcastMessage("ready", opts);
	}
}

function bool(value: string | undefined) {
	return value !== undefined && value !== "false";
}
