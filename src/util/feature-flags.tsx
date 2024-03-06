import { FeatureFlags, TFeatureFlags } from "@theopensource-company/feature-flags";
import { featureFlagsHookFactory } from "@theopensource-company/feature-flags/react";
import { Environment } from "./environment";

// How to write a schema for feature flags:
// https://github.com/theopensource-company/feature-flags?tab=readme-ov-file#writing-a-schema
export const featureFlagSchema = {
	devTools: {
		options: [false, true]
	},
	templates: {
		options: [false, true]
	},
	listLicenses: {
		options: [false, true]
	},
	editor: {
		options: ["monaco", "codemirror"]
	},
} as const;

export const featureFlags = new FeatureFlags({
	schema: featureFlagSchema,

	// Defaults per environment
	environment: Environment,
	defaults: {
		prod: {},
		preview: {
			templates: true,
			listLicenses: true,
			editor: "codemirror"
		},
		dev: {
			devTools: true,
			templates: true,
			listLicenses: true,
			editor: "monaco"
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
