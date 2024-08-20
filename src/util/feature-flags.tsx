import { FeatureFlags, FeatureFlagSchema, TFeatureFlags } from "@theopensource-company/feature-flags";
import { featureFlagsHookFactory } from "@theopensource-company/feature-flags/react";
import { environment, isProduction } from "./environment";

// How to manage feature flag schema:
// https://github.com/theopensource-company/feature-flags?tab=readme-ov-file#writing-a-schema
export const schema = {
	feature_flags: {
		options: [false, true]
	},
	query_view: {
		options: [false, true]
	},
	explorer_view: {
		options: [false, true]
	},
	graphql_view: {
		options: [false, true]
	},
	designer_view: {
		options: [false, true]
	},
	auth_view: {
		options: [false, true]
	},
	functions_view: {
		options: [false, true]
	},
	models_view: {
		options: [false, true, 'force']
	},
	apidocs_view: {
		options: [false, true]
	},
	cloud_view: {
		options: [false, true],
	},
	themes: {
		options: [false, true]
	},
	newsfeed: {
		options: [false, true]
	},
	database_version_check: {
		options: [false, true]
	},
	highlight_tool: {
		options: [false, true],
	},
	surreal_compat: {
		options: ['v1', 'v2'],
	},
	cloud_endpoints: {
		options: ['production', 'custom'],
		readonly: isProduction,
	},
	changelog: {
		options: ['auto', 'hidden', 'read', 'unread'],
	}
} satisfies FeatureFlagSchema;

export const featureFlags = new FeatureFlags({
	environment,
	schema,
	defaults: {
		development: {
			feature_flags: true,
			query_view: true,
			explorer_view: true,
			graphql_view: true,
			designer_view: true,
			auth_view: true,
			functions_view: true,
			models_view: "force",
			apidocs_view: true,
			cloud_view: true,
			newsfeed: true,
			highlight_tool: true,
			themes: true,
		},
		preview: {
			query_view: true,
			explorer_view: true,
			graphql_view: true,
			designer_view: true,
			auth_view: true,
			functions_view: true,
			models_view: true,
			apidocs_view: true,
			cloud_view: true,
			database_version_check: true,
			newsfeed: true,
			themes: true,
		},
		production: {
			query_view: true,
			explorer_view: true,
			graphql_view: true,
			designer_view: true,
			auth_view: true,
			functions_view: true,
			models_view: true,
			apidocs_view: true,
			cloud_view: true,
			database_version_check: true,
			newsfeed: true,
			themes: true,
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
