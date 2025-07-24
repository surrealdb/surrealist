import { useMemo } from "react";
import { isDesktop } from "~/adapter";
import {
	DESIGNER_ALGORITHMS,
	DESIGNER_DIRECTIONS,
	DESIGNER_HOVER_FOCUS,
	DESIGNER_LINE_STYLES,
	DESIGNER_LINKS,
	DESIGNER_NODE_MODES,
	ORIENTATIONS,
	RESULT_MODES,
	SCALE_STEPS,
	SIDEBAR_MODES,
	SYNTAX_THEMES,
	THEMES,
	VIEW_PAGES,
} from "~/constants";
import { Flags, type Listable, Selectable, type SurrealistConfig } from "~/types";
import { useFeatureFlags } from "./feature-flags";
import { optional } from "./helpers";

interface ReaderWriter<T> {
	reader: (config: SurrealistConfig) => T;
	writer: (config: SurrealistConfig, value: T) => void;
}

export type PreferenceController =
	| CheckboxController
	| NumberController
	| TextController
	| SelectionController<any>
	| FlagSetController<any, any>;

export interface Preference {
	id: string;
	name: string;
	description: string;
	controller: PreferenceController;
}

export interface PreferenceSection {
	id: string;
	name: string;
	preferences: Preference[];
}

/**
 * A preference controller for a checkbox
 */
export class CheckboxController {
	constructor(public options: ReaderWriter<boolean>) {}
}

/**
 * A preference controller for a number
 */
export class NumberController {
	constructor(public options: ReaderWriter<number>) {}
}

/**
 * A preference controller for text inputs
 */
export class TextController {
	constructor(public options: ReaderWriter<string> & { placeholder?: string }) {}
}

/**
 * A preference controller for a selection dropdown
 */
export class SelectionController<T extends string> {
	constructor(public options: ReaderWriter<T> & { options: Selectable<T>[] }) {}
}

/**
 * A preference controller for a a set of boolean flags
 */
export class FlagSetController<K extends string, T extends Flags<K>> {
	constructor(
		public options: ReaderWriter<T> & {
			title: (amount: number) => string;
			options: Listable<K>[];
			default?: boolean;
			minWidth?: string | number;
		},
	) {}
}

/**
 * Compute available preferences based on the current state
 */
export function useComputedPreferences(): PreferenceSection[] {
	const [{ themes, syntax_themes, cloud_endpoints, gtm_debug, sidebar_customization }] =
		useFeatureFlags();

	return useMemo(() => {
		const sections: PreferenceSection[] = [];

		if (isDesktop) {
			sections.push({
				id: "window",
				name: "Window",
				preferences: [
					{
						id: "always-on-top",
						name: "Always on top",
						description: "Keep the window above all other windows",
						controller: new CheckboxController({
							reader: (config) => config.settings.behavior.windowPinned,
							writer: (config, value) => {
								config.settings.behavior.windowPinned = value;
							},
						}),
					},
					{
						id: "window-scale",
						name: "Window scale",
						description: "The zoom level of the window",
						controller: new SelectionController({
							options: SCALE_STEPS,
							reader: (config) => config.settings.appearance.windowScale.toString(),
							writer: (config, value) => {
								config.settings.appearance.windowScale = Number.parseFloat(value);
							},
						}),
					},
				],
			});
		}

		sections.push(
			{
				id: "appearance",
				name: "Appearance",
				preferences: [
					...optional(
						themes && {
							id: "theme",
							name: "Theme",
							description: "The color scheme of the application",
							controller: new SelectionController({
								options: THEMES,
								reader: (config) => config.settings.appearance.colorScheme,
								writer: (config, value) => {
									config.settings.appearance.colorScheme = value;
								},
							}),
						},
					),
					...optional(
						syntax_themes && {
							id: "syntax-theme",
							name: "Syntax theme",
							description: "The color scheme of highlighted code",
							controller: new SelectionController({
								options: SYNTAX_THEMES,
								reader: (config) => config.settings.appearance.syntaxTheme,
								writer: (config, value) => {
									config.settings.appearance.syntaxTheme = value;
								},
							}),
						},
					),
					{
						id: "editor-scale",
						name: "Editor scale",
						description: "The zoom level of all code editors",
						controller: new SelectionController({
							options: SCALE_STEPS,
							reader: (config) => config.settings.appearance.editorScale.toString(),
							writer: (config, value) => {
								config.settings.appearance.editorScale = Number.parseFloat(value);
							},
						}),
					},
				],
			},
			{
				id: "behavior",
				name: "Behavior",
				preferences: [
					{
						id: "enter-confirms",
						name: "Enter to confirm",
						description: "Use enter to confirm actions in confirmation modals",
						controller: new CheckboxController({
							reader: (config) => config.settings.behavior.enterConfirms,
							writer: (config, value) => {
								config.settings.behavior.enterConfirms = value;
							},
						}),
					},
				],
			},
			{
				id: "connection",
				name: "Connection",
				preferences: [
					{
						id: "version-check-timeout",
						name: "Version check timeout",
						description: "The maximum time to wait for a version check",
						controller: new NumberController({
							reader: (config) => config.settings.behavior.versionCheckTimeout,
							writer: (config, value) => {
								config.settings.behavior.versionCheckTimeout = value;
							},
						}),
					},
					{
						id: "reconnect-interval",
						name: "Reconnect interval",
						description: "The time to wait before reconnecting",
						controller: new NumberController({
							reader: (config) => config.settings.behavior.reconnectInterval,
							writer: (config, value) => {
								config.settings.behavior.reconnectInterval = value;
							},
						}),
					},
				],
			},
			{
				id: "editors",
				name: "Editors",
				preferences: [
					{
						id: "suggest-table-names",
						name: "Suggest table names",
						description: "Automatically suggest table names",
						controller: new CheckboxController({
							reader: (config) => config.settings.behavior.tableSuggest,
							writer: (config, value) => {
								config.settings.behavior.tableSuggest = value;
							},
						}),
					},
					{
						id: "suggest-param-names",
						name: "Suggest param names",
						description: "Automatically suggest variable names",
						controller: new CheckboxController({
							reader: (config) => config.settings.behavior.variableSuggest,
							writer: (config, value) => {
								config.settings.behavior.variableSuggest = value;
							},
						}),
					},
				],
			},
			{
				id: "line-numbers",
				name: "Line numbers",
				preferences: [
					{
						id: "query-editor",
						name: "Query editor",
						description: "Show line numbers in the query view editor",
						controller: new CheckboxController({
							reader: (config) => config.settings.appearance.queryLineNumbers,
							writer: (config, value) => {
								config.settings.appearance.queryLineNumbers = value;
							},
						}),
					},
					{
						id: "record-inspector",
						name: "Record inspector",
						description: "Show line numbers in the record inspector",
						controller: new CheckboxController({
							reader: (config) => config.settings.appearance.inspectorLineNumbers,
							writer: (config, value) => {
								config.settings.appearance.inspectorLineNumbers = value;
							},
						}),
					},
					{
						id: "function-editor",
						name: "Function editor",
						description: "Show line numbers in the functions view editor",
						controller: new CheckboxController({
							reader: (config) => config.settings.appearance.functionLineNumbers,
							writer: (config, value) => {
								config.settings.appearance.functionLineNumbers = value;
							},
						}),
					},
				],
			},
			{
				id: "sidebar",
				name: "Sidebar",
				preferences: [
					{
						id: "sidebar-appearance",
						name: "Sidebar appearance",
						description: "Control the appearance of the sidebar",
						controller: new SelectionController({
							options: SIDEBAR_MODES,
							reader: (config) => config.settings.appearance.sidebarMode,
							writer: (config, value) => {
								config.settings.appearance.sidebarMode = value;
							},
						}),
					},
					...optional<Preference>(
						sidebar_customization && {
							id: "customize-sidebar-views",
							name: "Customise sidebar views",
							description: "Show or hide individual views in the sidebar",
							controller: new FlagSetController({
								default: true,
								title: (n) => `${n} views enabled`,
								options: Object.values(VIEW_PAGES).map((mode) => ({
									label: mode.name,
									value: mode.id,
									icon: mode.icon,
								})),
								reader: (config) => {
									return config.settings.appearance.sidebarViews;
								},
								writer: (config, value) => {
									config.settings.appearance.sidebarViews = value;
								},
							}),
						},
					),
				],
			},
			{
				id: "query-view",
				name: "Query view",
				preferences: [
					{
						id: "default-result-mode",
						name: "Default result mode",
						description: "The default result view mode for new queries",
						controller: new SelectionController({
							options: RESULT_MODES,
							reader: (config) => config.settings.appearance.defaultResultMode,
							writer: (config, value) => {
								config.settings.appearance.defaultResultMode = value;
							},
						}),
					},
					{
						id: "orientation",
						name: "Orientation",
						description: "The orientation of the query and result panels",
						controller: new SelectionController({
							options: ORIENTATIONS,
							reader: (config) => config.settings.appearance.queryOrientation,
							writer: (config, value) => {
								config.settings.appearance.queryOrientation = value;
							},
						}),
					},
					{
						id: "query-selection-execution",
						name: "Execute selection",
						description: "Executing only the selected portion of a query",
						controller: new CheckboxController({
							reader: (config) => config.settings.behavior.querySelectionExecution,
							writer: (config, value) => {
								config.settings.behavior.querySelectionExecution = value;
							},
						}),
					},
					{
						id: "query-selection-execution-warning",
						name: "Execute selection warning",
						description: "Display a warning when selecting a portion of a query",
						controller: new CheckboxController({
							reader: (config) =>
								config.settings.behavior.querySelectionExecutionWarning,
							writer: (config, value) => {
								config.settings.behavior.querySelectionExecutionWarning = value;
							},
						}),
					},
					{
						id: "query-validation",
						name: "Query validation",
						description: "Validate queries for potential issues",
						controller: new CheckboxController({
							reader: (config) => config.settings.behavior.queryErrorChecker,
							writer: (config, value) => {
								config.settings.behavior.queryErrorChecker = value;
							},
						}),
					},
					{
						id: "quick-query-closing",
						name: "Quick query closing",
						description: "Display query close buttons on hover",
						controller: new CheckboxController({
							reader: (config) => config.settings.behavior.queryQuickClose,
							writer: (config, value) => {
								config.settings.behavior.queryQuickClose = value;
							},
						}),
					},
				],
			},
			{
				id: "designer-view",
				name: "Designer view",
				preferences: [
					{
						id: "default-line-style",
						name: "Default line style",
						description: "The default appearance of relations",
						controller: new SelectionController({
							options: nodef(DESIGNER_LINE_STYLES),
							reader: (config) => config.settings.appearance.defaultDiagramLineStyle,
							writer: (config, value) => {
								config.settings.appearance.defaultDiagramLineStyle = value;
							},
						}),
					},
					{
						id: "default-algorithm",
						name: "Default algorithm",
						description: "The default layout algorithm",
						controller: new SelectionController({
							options: nodef(DESIGNER_ALGORITHMS),
							reader: (config) => config.settings.appearance.defaultDiagramAlgorithm,
							writer: (config, value) => {
								config.settings.appearance.defaultDiagramAlgorithm = value;
							},
						}),
					},
					{
						id: "default-table-appearance",
						name: "Default table appearance",
						description: "The default appearance of tables",
						controller: new SelectionController({
							options: nodef(DESIGNER_NODE_MODES),
							reader: (config) => config.settings.appearance.defaultDiagramMode,
							writer: (config, value) => {
								config.settings.appearance.defaultDiagramMode = value;
							},
						}),
					},
					{
						id: "default-layout-direction",
						name: "Default layout direction",
						description: "The default diagram direction",
						controller: new SelectionController({
							options: nodef(DESIGNER_DIRECTIONS),
							reader: (config) => config.settings.appearance.defaultDiagramDirection,
							writer: (config, value) => {
								config.settings.appearance.defaultDiagramDirection = value;
							},
						}),
					},
					{
						id: "default-record-link-visibility",
						name: "Default record link visibility",
						description: "The default visibility of record links",
						controller: new SelectionController({
							options: nodef(DESIGNER_LINKS),
							reader: (config) => config.settings.appearance.defaultDiagramLinkMode,
							writer: (config, value) => {
								config.settings.appearance.defaultDiagramLinkMode = value;
							},
						}),
					},
					{
						id: "default-relational-hover-focus",
						name: "Default relational hover focus",
						description: "The default dimming behaviour of relations when hovered",
						controller: new SelectionController({
							options: nodef(DESIGNER_HOVER_FOCUS),
							reader: (config) => config.settings.appearance.defaultDiagramHoverFocus,
							writer: (config, value) => {
								config.settings.appearance.defaultDiagramHoverFocus = value;
							},
						}),
					},
				],
			},
		);

		if (cloud_endpoints === "custom") {
			sections.push({
				id: "cloud-endpoints",
				name: "Cloud endpoints",
				preferences: [
					{
						id: "auth-base",
						name: "Auth base",
						description: "The base URL for cloud authentication",
						controller: new TextController({
							placeholder: "https://...",
							reader: (config) => config.settings.cloud.urlAuthBase,
							writer: (config, value) => {
								config.settings.cloud.urlAuthBase = value;
							},
						}),
					},
					{
						id: "api-base",
						name: "API base",
						description: "The base URL for the cloud API",
						controller: new TextController({
							placeholder: "https://...",
							reader: (config) => config.settings.cloud.urlApiBase,
							writer: (config, value) => {
								config.settings.cloud.urlApiBase = value;
								config.settings.cloud.urlApiMgmtBase = value;
							},
						}),
					},
				],
			});
		}

		if (gtm_debug) {
			sections.push({
				id: "gtm-debug",
				name: "GTM Debug",
				preferences: [
					{
						id: "gtm-origin",
						name: "Origin",
						description:
							"What host to use for the origin. Origin is only overridden in the desktop app",
						controller: new SelectionController({
							options: [
								{ label: "Production", value: "app.surrealdb.com" },
								{ label: "Beta", value: "beta-app.surrealdb.com" },
								{ label: "Development", value: "dev-app.surrealdb.com" },
							] as const,
							reader: (config) => config.settings.gtm.origin,
							writer: (config, value) => {
								config.settings.gtm.origin = value;
							},
						}),
					},
					{
						id: "gtm-debug-mode",
						name: "Debug Mode",
						description: "Enable debug mode for GTM requests",
						controller: new CheckboxController({
							reader: (config) => config.settings.gtm.debug_mode,
							writer: (config, value) => {
								config.settings.gtm.debug_mode = value;
							},
						}),
					},
					{
						id: "gtm-preview-header",
						name: "X-Gtm-Server-Preview",
						description:
							"Header value can be obtained inside the GTM preview application",
						controller: new TextController({
							reader: (config) => config.settings.gtm.preview_header,
							writer: (config, value) => {
								config.settings.gtm.preview_header = value;
							},
						}),
					},
				],
			});
		}

		return sections;
	}, [cloud_endpoints, gtm_debug, sidebar_customization, syntax_themes, themes]);
}

function nodef<T extends string>(items: Selectable<T>[]) {
	return items.filter(({ value }) => value !== "default");
}
