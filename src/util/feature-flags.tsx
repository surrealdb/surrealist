import { FeatureFlags, TFeatureFlags } from "@theopensource-company/feature-flags";
import { featureFlagsHookFactory } from "@theopensource-company/feature-flags/react";
import { environment } from "./environment";

// How to manage feature flag schema:
// https://github.com/theopensource-company/feature-flags?tab=readme-ov-file#writing-a-schema
export const schema = {
	featureFlags: {
		options: [false, true]
	},
	models_view: {
		options: [false, true, 'force']
	},
	apidocs_view: {
		options: [false, true]
	},
	themes: {
		options: [false, true]
	},
	newsfeed: {
		options: [false, true]
	},
} as const;

export const featureFlags = new FeatureFlags({
	environment,
	schema,
	defaults: {
		development: {
			featureFlags: true,
			models_view: "force",
			apidocs_view: true,
			newsfeed: true
		},
		preview: {
			models_view: true,
			apidocs_view: true,
			newsfeed: true
		},
		production: {
			models_view: true,
			apidocs_view: true,
			newsfeed: true
		},
	},
	overrides: (flag) => {
		const value = import.meta.env[`VITE_FFLAG_${flag.toUpperCase()}`];

		if (value) {
			return JSON.parse(value);
		}
	},
});

export const useFeatureFlags = featureFlagsHookFactory(featureFlags);

export type FeatureFlagMap = TFeatureFlags<typeof schema>;
