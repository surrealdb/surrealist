import {
	DESIGNER_DIRECTIONS,
	DESIGNER_NODE_MODES,
	LINE_STYLES,
	ORIENTATIONS,
	RESULT_MODES,
	SCALE_STEPS,
	SIDEBAR_MODES,
	SYNTAX_THEMES,
	THEMES,
} from "~/constants";

import { toggle } from "radash";
import { isDesktop } from "~/adapter";
import type { Selection, SurrealistConfig } from "~/types";
import { featureFlags } from "./feature-flags";
import { optional } from "./helpers";

interface ReaderWriter<T> {
	reader: (config: SurrealistConfig) => T;
	writer: (config: SurrealistConfig, value: T) => void;
}

export type PreferenceController =
	| CheckboxController
	| NumberController
	| TextController
	| SelectionController<any>;

export interface Preference {
	name: string;
	description: string;
	controller: PreferenceController;
}

export interface PreferenceSection {
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
	constructor(public options: ReaderWriter<T> & { options: Selection<T> }) {}
}

/**
 * Compute available preferences based on the current state
 */
export function computePreferences(): PreferenceSection[] {
	const { themes, syntax_themes, cloud_endpoints } = featureFlags.store;

	const sections: PreferenceSection[] = [];

	if (isDesktop) {
		sections.push({
			name: "Window",
			preferences: [
				{
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
			name: "Appearance",
			preferences: [
				...optional(
					themes && {
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
					name: "Sidebar",
					description: "Control the appearance of the sidebar",
					controller: new SelectionController({
						options: SIDEBAR_MODES,
						reader: (config) => config.settings.appearance.sidebarMode,
						writer: (config, value) => {
							config.settings.appearance.sidebarMode = value;
						},
					}),
				},
				{
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
			name: "Connection",
			preferences: [
				{
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
			name: "Editors",
			preferences: [
				{
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
			name: "Line numbers",
			preferences: [
				{
					name: "Query editor",
					description: "Show line numbers in the query view editor",
					controller: new CheckboxController({
						reader: (config) =>
							config.settings.appearance.lineNumbers.includes("query"),
						writer: (config) => {
							config.settings.appearance.lineNumbers = toggle(
								config.settings.appearance.lineNumbers,
								"query",
							);
						},
					}),
				},
				{
					name: "Record inspector",
					description: "Show line numbers in the record inspector",
					controller: new CheckboxController({
						reader: (config) =>
							config.settings.appearance.lineNumbers.includes("inspector"),
						writer: (config) => {
							config.settings.appearance.lineNumbers = toggle(
								config.settings.appearance.lineNumbers,
								"inspector",
							);
						},
					}),
				},
				{
					name: "Function editor",
					description: "Show line numbers in the functions view editor",
					controller: new CheckboxController({
						reader: (config) =>
							config.settings.appearance.lineNumbers.includes("functions"),
						writer: (config) => {
							config.settings.appearance.lineNumbers = toggle(
								config.settings.appearance.lineNumbers,
								"functions",
							);
						},
					}),
				},
			],
		},
		{
			name: "Query view",
			preferences: [
				{
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
			],
		},
		{
			name: "Designer view",
			preferences: [
				{
					name: "Line style",
					description: "The style of lines connecting nodes",
					controller: new SelectionController({
						options: LINE_STYLES,
						reader: (config) => config.settings.appearance.lineStyle,
						writer: (config, value) => {
							config.settings.appearance.lineStyle = value;
						},
					}),
				},
				{
					name: "Default node appearance",
					description: "The default appearance for nodes in new connection",
					controller: new SelectionController({
						options: DESIGNER_NODE_MODES,
						reader: (config) => config.settings.appearance.defaultDiagramMode,
						writer: (config, value) => {
							config.settings.appearance.defaultDiagramMode = value;
						},
					}),
				},
				{
					name: "Default layout direction",
					description: "The default diagram direction for new connections",
					controller: new SelectionController({
						options: DESIGNER_DIRECTIONS,
						reader: (config) => config.settings.appearance.defaultDiagramDirection,
						writer: (config, value) => {
							config.settings.appearance.defaultDiagramDirection = value;
						},
					}),
				},
				{
					name: "Show record links",
					description: "Whether to show links between nodes",
					controller: new CheckboxController({
						reader: (config) => config.settings.appearance.defaultDiagramShowLinks,
						writer: (config, value) => {
							config.settings.appearance.defaultDiagramShowLinks = value;
						},
					}),
				},
			],
		},
	);

	if (cloud_endpoints) {
		sections.push({
			name: "Cloud endpoints",
			preferences: [
				{
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

	return sections;
}
