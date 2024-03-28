import { FeatureFlags, TFeatureFlags } from "@theopensource-company/feature-flags";
import { featureFlagsHookFactory } from "@theopensource-company/feature-flags/react";
import { environment } from "./environment";

const Bool = [false, true] as const;

// How to write a schema for feature flags:
// https://github.com/theopensource-company/feature-flags?tab=readme-ov-file#writing-a-schema
export const featureFlagSchema = {
	devTools: {
		options: Bool
	},
	templates: {
		options: Bool
	},
	listLicenses: {
		options: Bool
	},
	editor: {
		options: ["monaco", "codemirror"]
	},
	functions_view: {
		options: Bool
	},
	models_view: {
		options: [false, true, 'force']
	},
	apidocs_view: {
		options: Bool
	},
	themes: {
		options: Bool
	},
	newsfeed: {
		options: Bool
	}
} as const;

export const featureFlags = new FeatureFlags({
	schema: featureFlagSchema,

	// Defaults per environment
	environment,
	defaults: {
		prod: {},
		preview: {
			templates: true,
			listLicenses: true,
			apidocs_view: true,
			editor: "codemirror"
		},
		dev: {
			devTools: true,
			templates: true,
			listLicenses: true,
			apidocs_view: true,
			editor: "monaco",
			newsfeed: true
		}
	},

	// Feature flags may be overwritten per environment
	overrides: (flag) => {
		const v = import.meta.env[`VITE_FFLAG_${flag.toUpperCase()}`];
		if (v) {
			const lower = v?.toLowerCase();
			return lower === 'true'
				? true
				: lower === 'false'
					? false
					: !v || Number.isNaN(+v)
						? v
						: Number.parseInt(v);
		}
	},
});

export const useFeatureFlags = featureFlagsHookFactory(featureFlags);

export type FeatureFlagMap = TFeatureFlags<typeof featureFlagSchema>;
