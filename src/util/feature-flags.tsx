import {
	type FeatureFlagSchema,
	FeatureFlags,
	type TFeatureFlags,
} from "@theopensource-company/feature-flags";
import { featureFlagsHookFactory } from "@theopensource-company/feature-flags/react";
import { environment } from "./environment";

// How to manage feature flag schema:
// https://github.com/theopensource-company/feature-flags?tab=readme-ov-file#writing-a-schema
export const schema = {
	feature_flags: {
		options: [false, true],
	},
	query_view: {
		options: [false, true],
	},
	explorer_view: {
		options: [false, true],
	},
	graphql_view: {
		options: [false, true],
	},
	designer_view: {
		options: [false, true],
	},
	auth_view: {
		options: [false, true],
	},
	functions_view: {
		options: [false, true],
	},
	parameters_view: {
		options: [false, true],
	},
	apidocs_view: {
		options: [false, true],
	},
	themes: {
		options: [false, true],
	},
	syntax_themes: {
		options: [false, true],
	},
	newsfeed: {
		options: [false, true],
	},
	database_version_check: {
		options: [false, true],
	},
	highlight_tool: {
		options: [false, true],
	},
	legacy_serve: {
		options: [false, true],
	},
	cloud_enabled: {
		options: [false, true],
	},
	cloud_endpoints: {
		options: ["production", "custom"],
	},
	cloud_access: {
		options: [false, true],
	},
	cloud_killswitch: {
		options: [false, true],
	},
	changelog: {
		options: ["auto", "hidden", "read", "unread"],
	},
	sidebar_customization: {
		options: [false, true],
	},
	gtm_debug: {
		options: [false, true],
	},
	organization_archiving: {
		options: [false, true],
	},
	sidekick_ai: {
		options: [false, true],
	},
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
			parameters_view: true,
			apidocs_view: true,
			newsfeed: true,
			highlight_tool: true,
			cloud_enabled: true,
			cloud_access: true,
			themes: true,
			syntax_themes: true,
			sidebar_customization: true,
			gtm_debug: false,
			organization_archiving: true,
			sidekick_ai: true,
		},
		preview: {
			query_view: true,
			explorer_view: true,
			graphql_view: true,
			designer_view: true,
			auth_view: true,
			functions_view: true,
			parameters_view: true,
			apidocs_view: true,
			changelog: "hidden",
			cloud_enabled: true,
			cloud_killswitch: true,
			cloud_access: true,
			newsfeed: true,
			themes: true,
			sidebar_customization: true,
			gtm_debug: false,
			sidekick_ai: true,
		},
		production: {
			query_view: true,
			explorer_view: true,
			graphql_view: true,
			designer_view: true,
			auth_view: true,
			functions_view: true,
			parameters_view: true,
			apidocs_view: true,
			database_version_check: true,
			cloud_enabled: true,
			cloud_killswitch: true,
			cloud_access: true,
			newsfeed: true,
			themes: true,
			gtm_debug: false,
			sidekick_ai: true,
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
