import type { MantineColorScheme } from "@mantine/core";
import { createWasmEngines } from "@surrealdb/wasm";
import { Surreal } from "surrealdb";
import { ORIENTATIONS, RESULT_MODES } from "~/constants";
import { executeQuery, executeUserQuery } from "~/screens/surrealist/connection/connection";
import type {
	DatasetType,
	MiniAppearance,
	Orientation,
	ResultMode,
	SurrealistConfig,
} from "~/types";
import { dedent } from "~/util/dedent";
import { createBaseQuery, createBaseSettings, createSandboxConnection } from "~/util/defaults";
import { showErrorNotification } from "~/util/helpers";
import { parseDatasetURL } from "~/util/language";
import { broadcastMessage } from "~/util/messaging";
import { createSurrealQL } from "~/util/surql";
import { BrowserAdapter } from "./browser";

const THEMES = new Set(["light", "dark", "auto"]);

export class MiniAdapter extends BrowserAdapter {
	public readonly id: string = "mini";

	public appearance: MiniAppearance = "normal";
	public corners: string | undefined = undefined;
	public transparent = false;
	public linenumbers = false;
	public uniqueRef = "";
	public autorun = false;

	#datasetQuery: string | undefined;
	#setupQuery: string | undefined;

	public async loadConfig() {
		const settings = createBaseSettings();
		const mainTab = createBaseQuery(settings, "config");
		const params = new URL(document.location.toString()).searchParams;
		const version = await this.#getEmbeddedVersion();
		const surrealql = createSurrealQL(version);

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
			linenumbers,
			autorun,
			resultmode,
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
				const parsed = await surrealql.parseValue(variables);
				mainTab.variables = await surrealql.formatValue(parsed, false, true);
			} catch {
				showErrorNotification({
					title: "Startup error",
					content: "Variables could not be parsed",
				});
			}
		}

		// Premade dataset loading
		if (dataset) {
			const datasetUrl = parseDatasetURL(dataset as DatasetType);

			if (datasetUrl) {
				this.#datasetQuery = await fetch(datasetUrl).then((res) => res.text());
			} else {
				showErrorNotification({
					title: "Startup error",
					content: "Dataset not recognised",
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
				showErrorNotification({
					title: "Startup error",
					content: "Theme not recognised",
				});
			}
		}

		// Orientation
		if (orientation) {
			if (ORIENTATIONS.some((o) => o.value === orientation)) {
				settings.appearance.queryOrientation = orientation as Orientation;
			} else {
				showErrorNotification({
					title: "Startup error",
					content: "Orientation not recognised",
				});
			}
		}

		// Result mode
		if (resultmode) {
			if (RESULT_MODES.some((m) => m.value === resultmode)) {
				mainTab.resultMode = resultmode as ResultMode;
			} else {
				showErrorNotification({
					title: "Startup error",
					content: "Result mode not recognised",
				});
			}
		}

		// Autorun query
		if (autorun !== undefined) {
			this.autorun = bool(autorun);
		}

		// Hide line numbers
		if (linenumbers !== undefined) {
			this.linenumbers = bool(linenumbers);
		}

		return {
			settings,
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

	async #getEmbeddedVersion(): Promise<string> {
		const surreal = new Surreal({
			engines: createWasmEngines(),
		});

		try {
			return (await surreal.version()).version.replace(/^surrealdb-/, "");
		} finally {
			await surreal.close();
		}
	}
}

function bool(value: string | undefined) {
	return value !== undefined && value !== "false";
}
