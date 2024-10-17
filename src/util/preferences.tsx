import {
	DESIGNER_DIRECTIONS,
	DESIGNER_NODE_MODES,
	LINE_STYLES,
	ORIENTATIONS,
	RESULT_MODES,
	SCALE_STEPS,
	SIDEBAR_MODES,
	THEMES,
	VALUE_MODES,
} from "~/constants";

import type { Selection, SurrealistConfig } from "~/types";
import { isDesktop } from "~/adapter";
import { parseScale } from "./helpers";

interface ReaderWriter<T> {
	reader: (config: SurrealistConfig) => T;
	writer: (config: SurrealistConfig, value: T) => void;
}

export type PreferenceController =
	| CheckboxController
	| NumberController
	| SelectionController<any>
	| BitfieldController<any>;

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
 * A preference controller for a selection dropdown
 */
export class SelectionController<T extends string> {
	constructor(public options: ReaderWriter<T> & { options: Selection<T> }) {}
}

/**
 * A preference controller for a checkbox fieldset
 */
export class BitfieldController<T extends string> {
	constructor(public options: ReaderWriter<T[]> & { options: Selection<T> }) {}
}

/**
 * Compute available preferences based on the current state
 */
export function computePreferences(): PreferenceSection[] {
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
						reader: (config) => parseScale(config.settings.appearance.windowScale),
						writer: (config, value) => {
							config.settings.appearance.windowScale = Number.parseFloat(value) / 100;
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
				{
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
					name: "Value formatting",
					description: "The format used to display values",
					controller: new SelectionController({
						options: VALUE_MODES,
						reader: (config) => config.settings.appearance.valueMode,
						writer: (config, value) => {
							config.settings.appearance.valueMode = value;
						},
					}),
				},
				{
					name: "Editor scale",
					description: "The zoom level of all code editors",
					controller: new SelectionController({
						options: SCALE_STEPS,
						reader: (config) => parseScale(config.settings.appearance.editorScale),
						writer: (config, value) => {
							config.settings.appearance.editorScale = Number.parseFloat(value) / 100;
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
				{
					name: "Line numbers",
					description: "Render line numbers in configured editors",
					controller: new BitfieldController({
						options: [
							{ label: "Table names", value: "query" },
							{ label: "Param names", value: "inspector" },
							{ label: "Function names", value: "functions" },
						] as const,
						reader: (config) => config.settings.appearance.lineNumbers,
						writer: (config, value) => {
							config.settings.appearance.lineNumbers = value;
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
					name: "Show links",
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

	return sections;
}
